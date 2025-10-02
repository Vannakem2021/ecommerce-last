'use server'

import { connectToDatabase } from '@/lib/db'
import Product, { IProduct } from '@/lib/db/models/product.model'
import Brand from '@/lib/db/models/brand.model'
import Category from '@/lib/db/models/category.model'
import { revalidatePath } from 'next/cache'
import { formatError } from '../utils'
import { ProductInputSchema, ProductUpdateSchema } from '../validator'
import { IProductInput } from '@/types'
import { z } from 'zod'
import { getSetting } from './setting.actions'
import { requirePermission } from '../rbac'
import Favorite from '@/lib/db/models/favorite.model'
import { i18n } from '@/i18n-config'

function revalidateFavoritesPaths() {
  try {
    for (const loc of i18n.locales) {
      revalidatePath(`/${loc.code}/favorites`)
    }
  } catch {}
}

// CREATE
export async function createProduct(data: IProductInput) {
  try {
    // Check if current user has permission to create products
    await requirePermission('products.create')

    const product = ProductInputSchema.parse(data)
    await connectToDatabase()
    await Product.create(product)
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'Product created successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE
export async function updateProduct(data: z.infer<typeof ProductUpdateSchema>) {
  try {
    // Check if current user has permission to update products
    await requirePermission('products.update')

    const product = ProductUpdateSchema.parse(data)
    await connectToDatabase()
    await Product.findByIdAndUpdate(product._id, product)
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'Product updated successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// DELETE
export async function deleteProduct(id: string) {
  try {
    // Check if current user has permission to delete products
    await requirePermission('products.delete')

    await connectToDatabase()
    const res = await Product.findByIdAndDelete(id)
    if (!res) throw new Error('Product not found')
    // Clean up orphaned favorites referencing this product
    await Favorite.deleteMany({ product: id })
    revalidatePath('/admin/products')
    revalidateFavoritesPaths()
    return {
      success: true,
      message: 'Product deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
// GET ONE PRODUCT BY ID
export async function getProductById(productId: string) {
  await connectToDatabase()

  // Ensure models are registered
  void Brand
  void Category

  const product = await Product.findById(productId)
    .populate('brand', 'name')
    .populate('category', 'name')
  return JSON.parse(JSON.stringify(product)) as IProduct
}

// GET PRODUCT METRICS (for overview cards)
export async function getProductMetrics() {
  await connectToDatabase()

  // Get total counts
  const totalProducts = await Product.countDocuments({})
  const publishedProducts = await Product.countDocuments({ isPublished: true })
  const draftProducts = totalProducts - publishedProducts
  const lowStockCount = await Product.countDocuments({
    countInStock: { $lte: 10, $gt: 0 }
  })
  const outOfStockCount = await Product.countDocuments({ countInStock: 0 })

  // Calculate total inventory value and average rating
  const aggregateData = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalValue: {
          $sum: { $multiply: ["$price", "$countInStock"] }
        },
        avgRating: { $avg: "$avgRating" }
      }
    }
  ])

  const totalValue = aggregateData[0]?.totalValue || 0
  const avgRating = aggregateData[0]?.avgRating || 0

  return {
    totalProducts,
    publishedProducts,
    draftProducts,
    lowStockCount,
    outOfStockCount,
    totalValue,
    avgRating: Math.round(avgRating * 10) / 10 // Round to 1 decimal
  }
}

// GET ALL PRODUCTS FOR ADMIN
export async function getAllProductsForAdmin({
  query,
  page = 1,
  sort = 'latest',
  limit,
}: {
  query: string
  page?: number
  sort?: string
  limit?: number
}) {
  await connectToDatabase()

  // Ensure models are registered
  void Brand
  void Category

  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  const queryFilter =
    query && query !== 'all'
      ? {
          name: {
            $regex: query,
            $options: 'i',
          },
        }
      : {}

  const order: Record<string, 1 | -1> =
    sort === 'best-selling'
      ? { numSales: -1 }
      : sort === 'price-low-to-high'
        ? { price: 1 }
        : sort === 'price-high-to-low'
          ? { price: -1 }
          : sort === 'avg-customer-review'
            ? { avgRating: -1 }
            : { _id: -1 }
  const products = await Product.find({
    ...queryFilter,
  })
    .populate('brand', 'name')
    .populate('category', 'name')
    .sort(order)
    .skip(limit * (Number(page) - 1))
    .limit(limit)
    .lean()

  const countProducts = await Product.countDocuments({
    ...queryFilter,
  })

  // Get global metrics for overview cards
  const metrics = await getProductMetrics()

  return {
    products: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(countProducts / pageSize),
    totalProducts: countProducts,
    from: pageSize * (Number(page) - 1) + 1,
    to: pageSize * (Number(page) - 1) + products.length,
    metrics, // Add global metrics
  }
}

export async function getAllCategories() {
  await connectToDatabase()
  const categories = await Category.find({ active: true }).select('name').lean()
  return categories.map((cat: any) => cat.name)
}
export async function getProductsForCard({
  tag,
  limit = 4,
}: {
  tag: string
  limit?: number
}) {
  await connectToDatabase()
  const products = await Product.find(
    { tags: { $in: [tag] }, isPublished: true },
    {
      name: 1,
      href: { $concat: ['/product/', '$slug'] },
      image: { $arrayElemAt: ['$images', 0] },
    }
  )
    .sort({ createdAt: 'desc' })
    .limit(limit)
  return JSON.parse(JSON.stringify(products)) as {
    name: string
    href: string
    image: string
  }[]
}
// GET PRODUCTS BY TAG
export async function getProductsByTag({
  tag,
  limit = 10,
}: {
  tag: string
  limit?: number
}) {
  await connectToDatabase()

  // Ensure models are registered
  void Brand
  void Category

  const products = await Product.find({
    tags: { $in: [tag] },
    isPublished: true,
  })
    .populate('brand', 'name')
    .populate('category', 'name')
    .sort({ createdAt: 'desc' })
    .limit(limit)
  return JSON.parse(JSON.stringify(products)) as IProduct[]
}

// GET ONE PRODUCT BY SLUG
export async function getProductBySlug(slug: string) {
  await connectToDatabase()

  // Ensure models are registered
  void Brand
  void Category

  const product = await Product.findOne({ slug, isPublished: true })
    .populate('brand', 'name')
    .populate('category', 'name')
  if (!product) throw new Error('Product not found')
  return JSON.parse(JSON.stringify(product)) as IProduct
}
// GET RELATED PRODUCTS: PRODUCTS WITH SAME CATEGORY
export async function getRelatedProductsByCategory({
  category,
  productId,
  limit = 4,
  page = 1,
}: {
  category: string
  productId: string
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()

  // Ensure models are registered
  void Brand
  void Category

  const skipAmount = (Number(page) - 1) * limit
  // Handle both string and ObjectId category references
  let categoryCondition = category
  if (typeof category === 'string') {
    const categoryDoc = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } })
    if (categoryDoc) {
      categoryCondition = categoryDoc._id
    }
  }

  const conditions = {
    isPublished: true,
    category: categoryCondition,
    _id: { $ne: productId },
  }
  const products = await Product.find(conditions)
    .populate('brand', 'name')
    .populate('category', 'name')
    .sort({ numSales: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const productsCount = await Product.countDocuments(conditions)
  return {
    data: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(productsCount / limit),
  }
}

// GET ALL PRODUCTS
export async function getAllProducts({
  query,
  limit,
  page,
  category,
  tag,
  price,
  rating,
  sort,
}: {
  query: string
  category: string
  tag: string
  limit?: number
  page: number
  price?: string
  rating?: string
  sort?: string
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()

  // Ensure models are registered
  void Brand
  void Category

  const queryFilter =
    query && query !== 'all'
      ? {
          name: {
            $regex: query,
            $options: 'i',
          },
        }
      : {}
  // Handle both string and ObjectId category filtering during transition
  let categoryFilter = {}
  if (category && category !== 'all') {
    // Try to find category by name first (for backward compatibility)
    const categoryDoc = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } })
    if (categoryDoc) {
      categoryFilter = { category: categoryDoc._id }
    } else {
      // Fallback to string matching for legacy data
      categoryFilter = { category }
    }
  }
  // Special handling for todays-deal tag - use sale date logic instead of tag filter
  let tagFilter = {}
  if (tag && tag !== 'all') {
    if (tag === 'todays-deal') {
      const now = new Date()
      tagFilter = {
        saleStartDate: { $lte: now },
        saleEndDate: { $gte: now },
      }
    } else {
      tagFilter = { tags: tag }
    }
  }

  const ratingFilter =
    rating && rating !== 'all'
      ? {
          avgRating: {
            $gte: Number(rating),
          },
        }
      : {}
  // 10-50
  const priceFilter =
    price && price !== 'all'
      ? {
          price: {
            $gte: Number(price.split('-')[0]),
            $lte: Number(price.split('-')[1]),
          },
        }
      : {}
  const order: Record<string, 1 | -1> =
    sort === 'best-selling'
      ? { numSales: -1 }
      : sort === 'price-low-to-high'
        ? { price: 1 }
        : sort === 'price-high-to-low'
          ? { price: -1 }
          : sort === 'avg-customer-review'
            ? { avgRating: -1 }
            : { _id: -1 }
  const isPublished = { isPublished: true }
  const products = await Product.find({
    ...isPublished,
    ...queryFilter,
    ...tagFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  })
    .populate('brand', 'name')
    .populate('category', 'name')
    .sort(order)
    .skip(limit * (Number(page) - 1))
    .limit(limit)
    .lean()

  const countProducts = await Product.countDocuments({
    ...queryFilter,
    ...tagFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  })
  return {
    products: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(countProducts / limit),
    totalProducts: countProducts,
    from: limit * (Number(page) - 1) + 1,
    to: limit * (Number(page) - 1) + products.length,
  }
}

export async function getAllTags() {
  const tags = await Product.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: null, uniqueTags: { $addToSet: '$tags' } } },
    { $project: { _id: 0, uniqueTags: 1 } },
  ])
  return (
    (tags[0]?.uniqueTags
      .sort((a: string, b: string) => a.localeCompare(b))
      .map((x: string) =>
        x
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      ) as string[]) || []
  )
}

// GET NEW ARRIVALS - LOGIC-BASED (using createdAt)
export async function getNewArrivals({
  limit = 10,
}: {
  limit?: number
} = {}) {
  await connectToDatabase()

  // Ensure models are registered
  void Brand
  void Category

  const products = await Product.find({
    isPublished: true,
  })
    .populate('brand', 'name')
    .populate('category', 'name')
    .sort({ createdAt: -1 }) // Most recent first
    .limit(limit)
  return JSON.parse(JSON.stringify(products)) as IProduct[]
}

// GET BEST SELLING PRODUCTS - LOGIC-BASED (using numSales)
export async function getBestSellingProducts({
  limit = 10,
}: {
  limit?: number
} = {}) {
  await connectToDatabase()

  // Ensure models are registered
  void Brand
  void Category

  const products = await Product.find({
    isPublished: true,
  })
    .populate('brand', 'name')
    .populate('category', 'name')
    .sort({ numSales: -1, createdAt: -1 }) // Best selling first, then most recent
    .limit(limit)
  return JSON.parse(JSON.stringify(products)) as IProduct[]
}

// GET TODAY'S DEALS - LOGIC-BASED (using time-based sale logic)
export async function getTodaysDeals({
  limit = 10,
}: {
  limit?: number
} = {}) {
  await connectToDatabase()

  // Ensure models are registered
  void Brand
  void Category

  const now = new Date()

  const products = await Product.find({
    isPublished: true,
    saleStartDate: { $lte: now },
    saleEndDate: { $gte: now },
  })
    .populate('brand', 'name')
    .populate('category', 'name')
    .sort({ saleEndDate: 1, createdAt: -1 }) // Ending soon first, then most recent
    .limit(limit)
  return JSON.parse(JSON.stringify(products)) as IProduct[]
}

// GET NEW ARRIVALS FOR CARD - LOGIC-BASED (using createdAt)
export async function getNewArrivalsForCard({
  limit = 4,
}: {
  limit?: number
} = {}) {
  await connectToDatabase()
  
  // Ensure models are registered
  void Brand
  void Category
  
  const products = await Product.find({ isPublished: true })
    .populate('brand', 'name')
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
  
  return JSON.parse(JSON.stringify(products)) as IProduct[]
}

// GET BEST SELLERS FOR CARD - LOGIC-BASED (using numSales)
export async function getBestSellersForCard({
  limit = 4,
}: {
  limit?: number
} = {}) {
  await connectToDatabase()
  
  // Ensure models are registered
  void Brand
  void Category
  
  const products = await Product.find({ isPublished: true })
    .populate('brand', 'name')
    .populate('category', 'name')
    .sort({ numSales: -1, createdAt: -1 })
    .limit(limit)
    .lean()
  
  return JSON.parse(JSON.stringify(products)) as IProduct[]
}


export async function getAllCategoriesWithCounts() {
  await connectToDatabase()
  const categories = await Category.find({ active: true })
    .select('name')
    .sort({ name: 1 })
    .lean()

  const categoriesWithCounts = await Promise.all(
    categories.map(async (cat: any) => {
      const count = await Product.countDocuments({
        category: cat._id,
        isPublished: true,
      })
      return {
        name: cat.name,
        count,
      }
    })
  )

  return categoriesWithCounts
}
// GET HOT DEALS FOR CARD - Products with discounts (listPrice > price)
export async function getHotDealsForCard({
  limit = 3,
}: {
  limit?: number
} = {}) {
  await connectToDatabase()
  
  // Ensure models are registered
  void Brand
  void Category
  
  const products = await Product.find({ 
    isPublished: true,
    $expr: { $gt: ['$listPrice', '$price'] } // listPrice > price (has discount)
  })
    .populate('brand', 'name')
    .populate('category', 'name')
    .sort({ createdAt: -1 }) // Most recent discounts first
    .limit(limit)
    .lean()
  
  return JSON.parse(JSON.stringify(products)) as IProduct[]
}

// GET PRODUCTS BY CATEGORY NAME - For category sections on home page
export async function getProductsByCategoryName({
  categoryName,
  limit = 6,
}: {
  categoryName: string
  limit?: number
}) {
  await connectToDatabase()
  
  // Ensure models are registered
  void Brand
  void Category
  
  // Find category by name (case-insensitive)
  const category = await Category.findOne({ 
    name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
  })
  
  if (!category) {
    return []
  }
  
  const products = await Product.find({ 
    isPublished: true,
    category: category._id,
  })
    .populate('brand', 'name')
    .populate('category', 'name')
    .sort({ createdAt: -1 }) // Most recent first
    .limit(limit)
    .lean()
  
  return JSON.parse(JSON.stringify(products)) as IProduct[]
}
