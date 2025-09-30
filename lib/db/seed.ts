/* eslint-disable @typescript-eslint/no-explicit-any */
import data, { getSeedPasswords, hasServerDependencies } from '@/lib/data'
import { connectToDatabase } from '.'
import User from './models/user.model'
import Product from './models/product.model'
import Review from './models/review.model'
import Brand from './models/brand.model'
import Category from './models/category.model'
import { cwd } from 'process'
import { loadEnvConfig } from '@next/env'
import { isProduction, logEnvironmentStatus, validateProductionSafety } from '../utils/environment'
import { validateStartupConfiguration } from '../utils/startup-validator'
import Order from './models/order.model'
import {
  calculateFutureDate,
  calculatePastDate,
  generateId,
  round2,
} from '../utils'
import { generateUniqueSKU } from '../utils/sku-generator'
import WebPage from './models/web-page.model'
import Setting from './models/setting.model'
import { OrderItem, IOrderInput, ShippingAddress } from '@/types'

loadEnvConfig(cwd())

const main = async () => {
  try {
    // Comprehensive startup validation
    console.log('🌱 Database Seeding - Configuration Validation')
    const startupValidation = await validateStartupConfiguration({
      throwOnFailure: false,
      logResults: true
    })

    // Security check: Prevent seeding in production
    if (isProduction()) {
      console.error('❌ ERROR: Database seeding is disabled in production environment for security reasons')
      console.error('This prevents accidental data corruption and maintains production data integrity')
      process.exit(1)
    }

    // Validate environment variables
    if (!startupValidation.success) {
      console.error('❌ ERROR: Startup validation failed:', startupValidation.errors)
      process.exit(1)
    }

    // Additional database-specific validation
    if (!startupValidation.services.database) {
      console.error('❌ ERROR: Database configuration is invalid')
      process.exit(1)
    }

    console.log('🌱 Starting database seeding...')

    // Validate that server dependencies are available
    if (!hasServerDependencies()) {
      console.error('❌ ERROR: Server dependencies not available for seeding')
      process.exit(1)
    }

    // Validate seed data for production safety patterns
    const safetyCheck = validateProductionSafety(data, 'seed data')
    if (!safetyCheck.isSecure) {
      console.warn('⚠️  Production safety warnings in seed data:')
      safetyCheck.warnings.forEach(warning => console.warn(`   ${warning}`))
    }

    const { users, products, reviews, webPages, settings } = data
    const seedPasswords = getSeedPasswords()
    await connectToDatabase(process.env.MONGODB_URI)

    await User.deleteMany()
    const createdUser = await User.insertMany(users)

    // Display admin credentials for development access
    if (seedPasswords) {
      console.log('\n🔐 ADMIN CREDENTIALS GENERATED:')
      console.log('================================')
      console.log('📧 Email: admin@gmail.com')
      console.log(`🔑 Password: ${seedPasswords.admin}`)
      console.log('🔒 These credentials are securely generated for security')
      console.log('⚠️  Save these credentials as they will not be shown again')
      console.log('💡 Other test user passwords are also securely generated')
      console.log('================================\n')
    } else {
      console.log('⚠️  Warning: Could not display admin credentials')
    }

    await Setting.deleteMany()
    const createdSetting = await Setting.insertMany(settings)

    await WebPage.deleteMany()
    await WebPage.insertMany(webPages)

    // Create brands and categories first
    await Brand.deleteMany()
    await Category.deleteMany()

    // Get unique brands and categories from products
    const uniqueBrands = [...new Set(products.map(p => p.brand))]
    const uniqueCategories = [...new Set(products.map(p => p.category))]

    // Create brand documents
    const brandDocs = uniqueBrands.map(name => ({ name, active: true }))
    const createdBrands = await Brand.insertMany(brandDocs)

    // Create category documents
    const categoryDocs = uniqueCategories.map(name => ({ name, active: true }))
    const createdCategories = await Category.insertMany(categoryDocs)

    // Create brand and category maps for lookup
    const brandMap = new Map(createdBrands.map(b => [b.name, b._id]))
    const categoryMap = new Map(createdCategories.map(c => [c.name, c._id]))

    await Product.deleteMany()

    // Generate SKUs for products and insert one by one to avoid duplicates
    const createdProducts = []
    for (const product of products) {
      const sku = await generateUniqueSKU(product.brand, product.category)

      // Convert brand and category names to ObjectIds
      const brandId = brandMap.get(product.brand)
      const categoryId = categoryMap.get(product.category)

      if (!brandId || !categoryId) {
        throw new Error(`Brand or category not found for product: ${product.name}`)
      }

      const createdProduct = await Product.create({
        ...product,
        sku,
        brand: brandId,
        category: categoryId,
        _id: undefined
      })
      createdProducts.push(createdProduct)
    }

    await Review.deleteMany()
    const rws = []
    for (let i = 0; i < createdProducts.length; i++) {
      let x = 0
      const { ratingDistribution } = createdProducts[i]
      for (let j = 0; j < ratingDistribution.length; j++) {
        for (let k = 0; k < ratingDistribution[j].count; k++) {
          x++
          rws.push({
            ...reviews.filter((x) => x.rating === j + 1)[
              x % reviews.filter((x) => x.rating === j + 1).length
            ],
            isVerifiedPurchase: true,
            product: createdProducts[i]._id,
            user: createdUser[x % createdUser.length]._id,
            updatedAt: Date.now(),
            createdAt: Date.now(),
          })
        }
      }
    }
    const createdReviews = await Review.insertMany(rws)

    await Order.deleteMany()
    const orders = []
    for (let i = 0; i < 200; i++) {
      orders.push(
        await generateOrder(
          i,
          createdUser.map((x) => x._id),
          createdProducts.map((x) => x._id)
        )
      )
    }
    const createdOrders = await Order.insertMany(orders)
    console.log({
      createdUser,
      createdBrands,
      createdCategories,
      createdProducts,
      createdReviews,
      createdOrders,
      createdSetting,
      message: 'Seeded database successfully',
    })

    // Final security reminder
    console.log('\n🔐 SECURITY REMINDERS:')
    console.log('======================')
    console.log('✅ All passwords have been securely generated')
    console.log('✅ Production seeding is disabled for safety')
    console.log('⚠️  Remember to change default credentials in production')
    console.log('⚠️  This seed data is for development/testing only')
    console.log('======================\n')

    process.exit(0)
  } catch (error) {
    console.error(error)
    throw new Error('Failed to seed database')
  }
}

const generateOrder = async (
  i: number,
  users: any,
  products: any
): Promise<IOrderInput> => {
  const product1 = await Product.findById(products[i % products.length])

  const product2 = await Product.findById(
    products[
      i % products.length >= products.length - 1
        ? (i % products.length) - 1
        : (i % products.length) + 1
    ]
  )
  const product3 = await Product.findById(
    products[
      i % products.length >= products.length - 2
        ? (i % products.length) - 2
        : (i % products.length) + 2
    ]
  )

  if (!product1 || !product2 || !product3) throw new Error('Product not found')

  const items = [
    {
      clientId: generateId(),
      product: product1._id,
      name: product1.name,
      slug: product1.slug,
      quantity: 1,
      image: product1.images[0],
      category: product1.category,
      price: product1.price,
      countInStock: product1.countInStock,
    },
    {
      clientId: generateId(),
      product: product2._id,
      name: product2.name,
      slug: product2.slug,
      quantity: 2,
      image: product2.images[0],
      category: product1.category,
      price: product2.price,
      countInStock: product1.countInStock,
    },
    {
      clientId: generateId(),
      product: product3._id,
      name: product3.name,
      slug: product3.slug,
      quantity: 3,
      image: product3.images[0],
      category: product1.category,
      price: product3.price,
      countInStock: product1.countInStock,
    },
  ]

  const order = {
    user: users[i % users.length],
    items: items.map((item) => ({
      ...item,
      product: item.product,
    })),
    shippingAddress: data.users[i % users.length].address,
    paymentMethod: data.users[i % users.length].paymentMethod,
    isPaid: true,
    isDelivered: true,
    paidAt: calculatePastDate(i),
    deliveredAt: calculatePastDate(i),
    createdAt: calculatePastDate(i),
    expectedDeliveryDate: calculateFutureDate(i % 2),
    ...calcDeliveryDateAndPriceForSeed({
      items: items,
      shippingAddress: data.users[i % users.length].address,
      deliveryDateIndex: i % 2,
    }),
  }
  return order
}

export const calcDeliveryDateAndPriceForSeed = ({
  items,
  deliveryDateIndex,
}: {
  deliveryDateIndex?: number
  items: OrderItem[]
  shippingAddress?: ShippingAddress
}) => {
  const { availableDeliveryDates } = data.settings[0]
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  )

  const deliveryDate =
    availableDeliveryDates[
      deliveryDateIndex === undefined
        ? availableDeliveryDates.length - 1
        : deliveryDateIndex
    ]

  const shippingPrice = deliveryDate.shippingPrice

  const taxPrice = round2(itemsPrice * 0.15)
  const totalPrice = round2(
    itemsPrice +
      (shippingPrice ? round2(shippingPrice) : 0) +
      (taxPrice ? round2(taxPrice) : 0)
  )
  return {
    availableDeliveryDates,
    deliveryDateIndex:
      deliveryDateIndex === undefined
        ? availableDeliveryDates.length - 1
        : deliveryDateIndex,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  }
}

main()
