'use server'

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import StockMovement from '@/lib/db/models/stock-movement.model'
import { revalidatePath } from 'next/cache'
import { formatError } from '../utils'
import { SetStockSchema, AdjustStockSchema, InventoryFiltersSchema } from '../validator'
import { ISetStock, IAdjustStock, IInventoryFilters, IInventoryProduct } from '@/types'
import { requirePermission, getCurrentUserWithRole } from '../rbac'

// GET ALL PRODUCTS FOR INVENTORY MANAGEMENT
export async function getAllProductsForInventory(filters: IInventoryFilters) {
  try {
    // Check if current user has permission to read inventory
    await requirePermission('inventory.read')

    const validatedFilters = InventoryFiltersSchema.parse(filters)
    await connectToDatabase()

    const { query, brand, category, page, sort } = validatedFilters
    const pageSize = 20

    // Build search query
    const searchQuery: Record<string, unknown> = {}
    
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { sku: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    }
    
    if (brand && brand !== 'all') {
      searchQuery.brand = brand
    }

    if (category && category !== 'all') {
      searchQuery.category = category
    }

    // Build sort query
    let sortQuery: Record<string, number> = {}
    switch (sort) {
      case 'latest':
        sortQuery = { createdAt: -1 }
        break
      case 'oldest':
        sortQuery = { createdAt: 1 }
        break
      case 'name-asc':
        sortQuery = { name: 1 }
        break
      case 'name-desc':
        sortQuery = { name: -1 }
        break
      case 'stock-low':
        sortQuery = { countInStock: 1 }
        break
      case 'stock-high':
        sortQuery = { countInStock: -1 }
        break
      default:
        sortQuery = { createdAt: -1 }
    }

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(searchQuery)
    const totalPages = Math.ceil(totalProducts / pageSize)

    // Get products with pagination
    const products = await Product.find(searchQuery)
      .select('name sku brand category countInStock price isPublished images createdAt updatedAt')
      .sort(sortQuery)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()

    // Get unique brands and categories for filters
    const [brands, categories] = await Promise.all([
      Product.distinct('brand'),
      Product.distinct('category')
    ])

    // Serialize products to plain objects
    const serializedProducts = products.map(product => ({
      _id: product._id.toString(),
      name: product.name,
      sku: product.sku,
      brand: product.brand,
      category: product.category,
      countInStock: product.countInStock,
      price: product.price,
      isPublished: product.isPublished,
      images: product.images,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }))

    return {
      success: true,
      products: serializedProducts as IInventoryProduct[],
      totalProducts,
      totalPages,
      currentPage: page,
      brands: brands.sort(),
      categories: categories.sort()
    }
  } catch (error) {
    return { 
      success: false, 
      message: formatError(error),
      products: [],
      totalProducts: 0,
      totalPages: 0,
      currentPage: 1,
      brands: [],
      categories: []
    }
  }
}

// SET PRODUCT STOCK (Absolute quantity)
export async function setProductStock(data: ISetStock) {
  try {
    // Check if current user has permission to update inventory
    await requirePermission('inventory.update')

    const currentUser = await getCurrentUserWithRole()
    const validatedData = SetStockSchema.parse(data)
    await connectToDatabase()

    // Get current product data
    const product = await Product.findById(validatedData.productId).select('sku countInStock')
    if (!product) {
      throw new Error('Product not found')
    }

    const previousStock = product.countInStock
    const newStock = validatedData.newQuantity

    // Update product stock
    await Product.findByIdAndUpdate(validatedData.productId, {
      countInStock: newStock
    })

    // Create stock movement record
    await StockMovement.create({
      product: validatedData.productId,
      sku: product.sku,
      type: 'SET',
      quantity: newStock - previousStock,
      previousStock,
      newStock,
      reason: validatedData.reason,
      notes: validatedData.notes,
      createdBy: currentUser.id,
    })

    revalidatePath('/admin/inventory')
    revalidatePath('/admin/products')

    return {
      success: true,
      message: `Stock set to ${newStock} for product ${product.sku}`,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// ADJUST PRODUCT STOCK (Relative quantity change)
export async function adjustProductStock(data: IAdjustStock) {
  try {
    // Check if current user has permission to update inventory
    await requirePermission('inventory.update')

    const currentUser = await getCurrentUserWithRole()
    const validatedData = AdjustStockSchema.parse(data)
    await connectToDatabase()

    // Get current product data
    const product = await Product.findById(validatedData.productId).select('sku countInStock')
    if (!product) {
      throw new Error('Product not found')
    }

    const previousStock = product.countInStock
    const newStock = Math.max(0, previousStock + validatedData.adjustment)

    // Update product stock
    await Product.findByIdAndUpdate(validatedData.productId, {
      countInStock: newStock
    })

    // Create stock movement record
    await StockMovement.create({
      product: validatedData.productId,
      sku: product.sku,
      type: 'ADJUST',
      quantity: validatedData.adjustment,
      previousStock,
      newStock,
      reason: validatedData.reason,
      notes: validatedData.notes,
      createdBy: currentUser.id,
    })

    revalidatePath('/admin/inventory')
    revalidatePath('/admin/products')

    const adjustmentText = validatedData.adjustment > 0 ? 'increased' : 'decreased'
    return {
      success: true,
      message: `Stock ${adjustmentText} by ${Math.abs(validatedData.adjustment)} for product ${product.sku}`,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// GET STOCK MOVEMENTS FOR A PRODUCT
export async function getStockMovements(productId: string, page: number = 1) {
  try {
    await connectToDatabase()

    const pageSize = 20
    const skip = (page - 1) * pageSize

    // Get total count
    const totalMovements = await StockMovement.countDocuments({ product: productId })
    const totalPages = Math.ceil(totalMovements / pageSize)

    // Get movements with user details
    const movements = await StockMovement.find({ product: productId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()

    // Serialize movements to plain objects
    const serializedMovements = movements.map(movement => ({
      _id: movement._id.toString(),
      type: movement.type,
      quantity: movement.quantity,
      previousStock: movement.previousStock,
      newStock: movement.newStock,
      reason: movement.reason,
      notes: movement.notes,
      createdAt: movement.createdAt.toISOString(),
      createdBy: {
        name: movement.createdBy?.name || 'Unknown User',
        email: movement.createdBy?.email || 'unknown@example.com'
      }
    }))

    return {
      success: true,
      movements: serializedMovements,
      totalMovements,
      totalPages,
      currentPage: page
    }
  } catch (error) {
    return { 
      success: false, 
      message: formatError(error),
      movements: [],
      totalMovements: 0,
      totalPages: 0,
      currentPage: 1
    }
  }
}

// GET STOCK MOVEMENT SUMMARY
export async function getStockMovementSummary(productId: string) {
  try {
    await connectToDatabase()

    const summary = await StockMovement.aggregate([
      { $match: { product: productId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ])

    return {
      success: true,
      summary
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
      summary: []
    }
  }
}

// CREATE STOCK MOVEMENT FOR SALE (Used by order system)
export async function createSaleStockMovement(
  productId: string,
  quantity: number,
  orderId: string,
  userId: string
) {
  try {
    await connectToDatabase()

    // Get current product data
    const product = await Product.findById(productId).select('sku countInStock')
    if (!product) {
      throw new Error('Product not found')
    }

    const previousStock = product.countInStock
    const newStock = Math.max(0, previousStock - quantity)

    // Create stock movement record
    await StockMovement.create({
      product: productId,
      sku: product.sku,
      type: 'SALE',
      quantity: -quantity, // Negative because it's a reduction
      previousStock,
      newStock,
      reason: `Sale - Order #${orderId}`,
      notes: `Stock reduced due to order payment confirmation`,
      createdBy: userId,
    })

    return {
      success: true,
      message: `Stock movement recorded for sale of ${quantity} units`,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// CREATE STOCK MOVEMENT FOR RETURN (Used by order system)
export async function createReturnStockMovement(
  productId: string,
  quantity: number,
  orderId: string,
  userId: string,
  reason: string = 'Product return'
) {
  try {
    await connectToDatabase()

    // Get current product data
    const product = await Product.findById(productId).select('sku countInStock')
    if (!product) {
      throw new Error('Product not found')
    }

    const previousStock = product.countInStock
    const newStock = previousStock + quantity

    // Update product stock
    await Product.findByIdAndUpdate(productId, {
      countInStock: newStock
    })

    // Create stock movement record
    await StockMovement.create({
      product: productId,
      sku: product.sku,
      type: 'RETURN',
      quantity: quantity, // Positive because it's an increase
      previousStock,
      newStock,
      reason: `Return - Order #${orderId}`,
      notes: `Stock increased due to product return: ${reason}`,
      createdBy: userId,
    })

    return {
      success: true,
      message: `Stock movement recorded for return of ${quantity} units`,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
