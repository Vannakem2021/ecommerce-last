'use server'

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import Brand from '@/lib/db/models/brand.model'
import Category from '@/lib/db/models/category.model'
import StockMovement from '@/lib/db/models/stock-movement.model'
import mongoose from 'mongoose'
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
      // For text search, we'll need to populate and search in the aggregation pipeline
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { sku: { $regex: query, $options: 'i' } }
      ]
    }

    // Handle brand filtering with ObjectId support
    if (brand && brand !== 'all') {
      if (typeof brand === 'string' && brand.length === 24) {
        // Assume it's an ObjectId
        searchQuery.brand = brand
      } else {
        // Find brand by name
        const brandDoc = await Brand.findOne({ name: brand })
        if (brandDoc) {
          searchQuery.brand = brandDoc._id
        }
      }
    }

    // Handle category filtering with ObjectId support
    if (category && category !== 'all') {
      if (typeof category === 'string' && category.length === 24) {
        // Assume it's an ObjectId
        searchQuery.category = category
      } else {
        // Find category by name
        const categoryDoc = await Category.findOne({ name: category })
        if (categoryDoc) {
          searchQuery.category = categoryDoc._id
        }
      }
    }

    // Build sort query
    let sortQuery: { [key: string]: 1 | -1 } = {}
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
      .populate('brand', 'name')
      .populate('category', 'name')
      .sort(sortQuery)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()

    // Get unique brands and categories for filters from their respective collections
    const [brands, categories] = await Promise.all([
      Brand.find({ active: true }).select('name').lean(),
      Category.find({ active: true }).select('name').lean()
    ])

    // Serialize products to plain objects
    const serializedProducts = products.map(product => ({
      _id: product._id.toString(),
      name: product.name,
      sku: product.sku,
      brand: typeof product.brand === 'object' ? (product.brand as unknown as { name: string }).name : product.brand,
      category: typeof product.category === 'object' ? (product.category as unknown as { name: string }).name : product.category,
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
      brands: brands.map((b: any) => b.name).sort(),
      categories: categories.map((c: any) => c.name).sort()
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
        name: typeof movement.createdBy === 'object' && movement.createdBy ? (movement.createdBy as { name?: string }).name || 'Unknown User' : 'Unknown User',
        email: typeof movement.createdBy === 'object' && movement.createdBy ? (movement.createdBy as { email?: string }).email || 'unknown@example.com' : 'unknown@example.com'
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
  userId: string,
  session?: mongoose.ClientSession
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

    // Create stock movement record (supports optional session)
    const doc = {
      product: productId,
      sku: product.sku,
      type: 'SALE',
      quantity: -quantity, // Negative because it's a reduction
      previousStock,
      newStock,
      reason: `Sale - Order #${orderId}`,
      notes: `Stock reduced due to order payment confirmation`,
      createdBy: userId,
    }
    if (session) {
      await StockMovement.create([doc], { session })
    } else {
      await StockMovement.create(doc as any)
    }

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
