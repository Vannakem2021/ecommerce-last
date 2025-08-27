import { NextRequest, NextResponse } from 'next/server'

import Product from '@/lib/db/models/product.model'
import Category from '@/lib/db/models/category.model'
import { connectToDatabase } from '@/lib/db'

export const GET = async (request: NextRequest) => {
  const listType = request.nextUrl.searchParams.get('type') || 'history'
  const productIdsParam = request.nextUrl.searchParams.get('ids')
  const categoriesParam = request.nextUrl.searchParams.get('categories')

  if (!productIdsParam || !categoriesParam) {
    return NextResponse.json([])
  }

  const productIds = productIdsParam.split(',')
  const categories = categoriesParam.split(',')

  await connectToDatabase()

  let filter
  if (listType === 'history') {
    filter = { _id: { $in: productIds } }
  } else {
    // Convert category names to ObjectIds for related products
    const categoryDocs = await Category.find({ name: { $in: categories } }).select('_id').lean()
    const categoryIds = categoryDocs.map(cat => cat._id)
    filter = { category: { $in: categoryIds }, _id: { $nin: productIds } }
  }

  const products = await Product.find(filter)
    .populate('brand', 'name')
    .populate('category', 'name')

  if (listType === 'history')
    return NextResponse.json(
      products.sort(
        (a, b) =>
          productIds.indexOf(a._id.toString()) -
          productIds.indexOf(b._id.toString())
      )
    )
  return NextResponse.json(products)
}
