import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import data, { getSeedPasswords } from '@/lib/data'
import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import Product from '@/lib/db/models/product.model'
import Review from '@/lib/db/models/review.model'
import Brand from '@/lib/db/models/brand.model'
import Category from '@/lib/db/models/category.model'
import Order from '@/lib/db/models/order.model'
import WebPage from '@/lib/db/models/web-page.model'
import Setting from '@/lib/db/models/setting.model'
import {
  calculatePastDate,
  generateId,
  round2,
} from '@/lib/utils'
import { generateUniqueSKU } from '@/lib/utils/sku-generator'
import { OrderItem, IOrderInput, ShippingAddress } from '@/types'

// Security token for additional protection
const SEED_SECRET = process.env.SEED_SECRET

export async function POST(request: NextRequest) {
  try {
    // Security Check 1: Verify admin authentication
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Security Check 2: Verify admin role
    if (session.user.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Security Check 3: Verify seed secret from request header
    const secretHeader = request.headers.get('x-seed-secret')
    if (!SEED_SECRET || secretHeader !== SEED_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing seed secret. Set SEED_SECRET environment variable.' },
        { status: 403 }
      )
    }

    // Get confirmation flag
    const body = await request.json()
    const { confirm } = body

    if (confirm !== 'DELETE_ALL_DATA') {
      return NextResponse.json({
        success: false,
        message: 'Confirmation required. Send { "confirm": "DELETE_ALL_DATA" } to proceed',
        warning: 'This will DELETE ALL existing data and cannot be undone!'
      }, { status: 400 })
    }

    console.log('🌱 Starting database seeding via API...')
    
    const { users, products, reviews, webPages, settings } = data
    const seedPasswords = getSeedPasswords()

    // Connect to database
    await connectToDatabase(process.env.MONGODB_URI)

    // Delete existing data
    console.log('🗑️  Deleting existing data...')
    await User.deleteMany()
    await Setting.deleteMany()
    await WebPage.deleteMany()
    await Brand.deleteMany()
    await Category.deleteMany()
    await Product.deleteMany()
    await Review.deleteMany()
    await Order.deleteMany()

    // Seed users
    console.log('👥 Seeding users...')
    const createdUser = await User.insertMany(users)

    // Seed settings
    console.log('⚙️  Seeding settings...')
    await Setting.insertMany(settings)

    // Seed web pages
    console.log('📄 Seeding web pages...')
    await WebPage.insertMany(webPages)

    // Seed brands and categories
    console.log('🏷️  Seeding brands and categories...')
    const brandMap = new Map()
    const categoryMap = new Map()

    for (const product of products) {
      if (product.brand && !brandMap.has(product.brand)) {
        const brand = await Brand.create({
          name: product.brand,
          slug: product.brand.toLowerCase().replace(/\s+/g, '-'),
        })
        brandMap.set(product.brand, brand._id)
      }
      if (product.category && !categoryMap.has(product.category)) {
        const category = await Category.create({
          name: product.category,
          slug: product.category.toLowerCase().replace(/\s+/g, '-'),
        })
        categoryMap.set(product.category, category._id)
      }
    }

    // Seed products
    console.log('📦 Seeding products...')
    const productsWithRefs = await Promise.all(
      products.map(async (product) => {
        const sku = await generateUniqueSKU(
          product.brand || 'NOBRAND',
          product.category || 'NOCAT'
        )
        return {
          ...product,
          brand: brandMap.get(product.brand) || undefined,
          category: categoryMap.get(product.category) || undefined,
          sku,
        }
      })
    )
    const createdProducts = await Product.insertMany(productsWithRefs)

    // Seed reviews
    console.log('⭐ Seeding reviews...')
    const reviewsWithRefs = reviews.map((review) => ({
      ...review,
      user: createdUser[0]._id,
      product: createdProducts[0]._id,
    }))
    await Review.insertMany(reviewsWithRefs)

    // Create sample orders
    console.log('🛒 Creating sample orders...')
    const orderData = await createSampleOrders(createdUser, createdProducts)
    await Order.insertMany(orderData)

    // Prepare response
    const credentials = seedPasswords
      ? {
          email: 'admin@gmail.com',
          password: seedPasswords.admin,
          warning: 'Save these credentials securely!',
        }
      : null

    console.log('✅ Database seeding completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      stats: {
        users: createdUser.length,
        products: createdProducts.length,
        reviews: reviewsWithRefs.length,
        orders: orderData.length,
        brands: brandMap.size,
        categories: categoryMap.size,
      },
      credentials,
    })
  } catch (error: any) {
    console.error('❌ Seeding error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Seeding failed',
        error: error.message,
      },
      { status: 500 }
    )
  }
}

// Helper function to create sample orders
async function createSampleOrders(users: any[], products: any[]) {
  const orders = []

  for (let i = 0; i < 5; i++) {
    const user = users[i % users.length]
    const numItems = Math.floor(Math.random() * 3) + 1
    const orderItems: OrderItem[] = []

    for (let j = 0; j < numItems; j++) {
      const product = products[j % products.length]
      orderItems.push({
        clientId: generateId(),
        product: product._id,
        name: product.name,
        slug: product.slug,
        category: product.category?.toString() || 'electronics',
        image: product.images[0],
        price: product.price,
        countInStock: product.countInStock,
        quantity: 1,
      })
    }

    const itemsPrice = round2(
      orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    )
    const shippingPrice = itemsPrice > 100 ? 0 : 10
    const taxPrice = round2(itemsPrice * 0.15)
    const totalPrice = round2(itemsPrice + shippingPrice + taxPrice)

    const shippingAddress: ShippingAddress = {
      fullName: user.name,
      phoneNumber: '+1234567890',
      streetAddress: '123 Main St',
      city: 'New York',
      province: 'NY',
      country: 'US',
      postalCode: '10001',
    }

    const order: IOrderInput = {
      user: user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod: 'PayPal',
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid: i % 2 === 0,
      paidAt: i % 2 === 0 ? calculatePastDate(Math.random() * 30) : undefined,
      isDelivered: i % 3 === 0,
      deliveredAt: i % 3 === 0 ? calculatePastDate(Math.random() * 15) : undefined,
    }

    orders.push(order)
  }

  return orders
}

// GET endpoint to check seed status
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    await connectToDatabase()

    const stats = {
      users: await User.countDocuments(),
      products: await Product.countDocuments(),
      orders: await Order.countDocuments(),
      categories: await Category.countDocuments(),
      brands: await Brand.countDocuments(),
    }

    return NextResponse.json({
      success: true,
      message: 'Database statistics',
      stats,
      isEmpty: Object.values(stats).every(count => count === 0),
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}
