import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import Category from '@/lib/db/models/category.model'
import { Types } from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || 'all'

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        products: [],
        categories: [],
        totalCount: 0,
        message: 'Query must be at least 2 characters',
      })
    }

    await connectToDatabase()

    // Build product search query
    const productSearchQuery: Record<string, unknown> = {
      isPublished: true, // Only show published products
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { sku: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ],
    }

    // Add category filter if specified
    if (category !== 'all') {
      let categoryId: string | null = null

      if (Types.ObjectId.isValid(category)) {
        const existingCategory = await Category.findOne({ _id: category, active: true })
          .select('_id')
          .lean()
        if (existingCategory) {
          categoryId = String(existingCategory._id)
        }
      }

      if (!categoryId) {
        const categoryDoc = await Category.findOne({
          name: { $regex: new RegExp(`^${category}$`, 'i') },
          active: true,
        })
          .select('_id')
          .lean()

        if (!categoryDoc) {
          return NextResponse.json({
            products: [],
            categories: [],
            totalCount: 0,
          })
        }

        categoryId = String(categoryDoc._id)
      }

      productSearchQuery.category = categoryId
    }

    // Search products (limit to top 10 for dropdown)
    const products = await Product.find(productSearchQuery)
      .select('_id name slug price images avgRating numReviews countInStock category')
      .limit(10)
      .sort({ avgRating: -1, numReviews: -1 }) // Sort by rating first
      .lean()

    // Get total count for "View All" link
    const totalCount = await Product.countDocuments(productSearchQuery)

    // Search matching categories
    const categories = await Category.find({
      active: true,
      name: { $regex: query, $options: 'i' },
    })
      .select('name')
      .limit(5)
      .lean()

    return NextResponse.json({
      products,
      categories: categories.map((c) => c.name),
      totalCount,
    })
  } catch (error) {
    console.error('Storefront search error:', error)
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    )
  }
}
