/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import Brand from '@/lib/db/models/brand.model'
import Category from '@/lib/db/models/category.model'
import { cwd } from 'process'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(cwd())

/**
 * Test script to verify the brand/category migration worked correctly
 */
const testMigration = async () => {
  try {
    console.log('Testing brand/category migration...')
    await connectToDatabase(process.env.MONGODB_URI)

    // Test 1: Check if brands and categories exist
    const brands = await Brand.find({}).lean()
    const categories = await Category.find({}).lean()
    
    console.log(`Found ${brands.length} brands:`, brands.map(b => b.name))
    console.log(`Found ${categories.length} categories:`, categories.map(c => c.name))

    // Test 2: Check if products have ObjectId references
    const products = await Product.find({}).limit(5).lean()
    
    console.log('\nTesting first 5 products:')
    for (const product of products) {
      const brandType = typeof product.brand
      const categoryType = typeof product.category
      
      console.log(`Product: ${product.name}`)
      console.log(`  Brand: ${product.brand} (type: ${brandType})`)
      console.log(`  Category: ${product.category} (type: ${categoryType})`)
      
      if (brandType === 'string' || categoryType === 'string') {
        console.log('  ⚠️  WARNING: Still has string references!')
      } else {
        console.log('  ✅ Has ObjectId references')
      }
    }

    // Test 3: Test population
    console.log('\nTesting population:')
    const populatedProduct = await Product.findOne({})
      .populate('brand', 'name')
      .populate('category', 'name')
      .lean()

    if (populatedProduct) {
      console.log(`Populated product: ${populatedProduct.name}`)
      console.log(`  Brand: ${JSON.stringify(populatedProduct.brand)}`)
      console.log(`  Category: ${JSON.stringify(populatedProduct.category)}`)
    }

    console.log('\nMigration test completed successfully!')
    
  } catch (error) {
    console.error('Migration test failed:', error)
    throw error
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testMigration()
    .then(() => {
      console.log('Test script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Test script failed:', error)
      process.exit(1)
    })
}

export default testMigration
