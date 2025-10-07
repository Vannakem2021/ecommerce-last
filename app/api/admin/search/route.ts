import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import Order from '@/lib/db/models/order.model'
import Product from '@/lib/db/models/product.model'
import User from '@/lib/db/models/user.model'
import Category from '@/lib/db/models/category.model'
import Brand from '@/lib/db/models/brand.model'

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or manager
    const isAdmin = session.user.role === 'admin' || session.user.role === 'manager'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (!query || query.length < 2) {
      return NextResponse.json({
        orders: [],
        products: [],
        users: [],
        categories: [],
        brands: []
      })
    }

    await connectToDatabase()

    // Check if query is a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(query)
    
    // Search across different models in parallel
    const [orders, products, users, categories, brands] = await Promise.all([
      // Search Orders (by ObjectId if valid, otherwise skip)
      isValidObjectId 
        ? Order.find({ _id: query })
            .populate('user', 'name email')
            .limit(5)
            .select('_id user totalPrice isPaid isDelivered createdAt')
            .lean()
        : Promise.resolve([]),

      // Search Products (by name or SKU)
      Product.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { sku: { $regex: query, $options: 'i' } }
        ]
      })
        .limit(5)
        .select('_id name sku price image isPublished')
        .lean(),

      // Search Users (by name or email)
      User.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      })
        .limit(5)
        .select('_id name email role createdAt')
        .lean(),

      // Search Categories (by name)
      Category.find({
        name: { $regex: query, $options: 'i' }
      })
        .limit(5)
        .select('_id name active')
        .lean(),

      // Search Brands (by name)
      Brand.find({
        name: { $regex: query, $options: 'i' }
      })
        .limit(5)
        .select('_id name logo active')
        .lean()
    ])

    return NextResponse.json({
      orders: JSON.parse(JSON.stringify(orders)),
      products: JSON.parse(JSON.stringify(products)),
      users: JSON.parse(JSON.stringify(users)),
      categories: JSON.parse(JSON.stringify(categories)),
      brands: JSON.parse(JSON.stringify(brands))
    })

  } catch (error) {
    console.error('Admin search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
