/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDatabase } from '.'
import Product from './models/product.model'
import Brand from './models/brand.model'
import Category from './models/category.model'
import { cwd } from 'process'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(cwd())

/**
 * Migration script to convert string brand/category references to ObjectId references
 * This script should be run once to migrate existing data
 */
const migrateBrandCategoryReferences = async () => {
  try {
    console.log('Starting brand/category migration...')
    await connectToDatabase(process.env.MONGODB_URI)

    // Step 1: Get all unique brands and categories from existing products
    const uniqueBrands = await Product.distinct('brand')
    const uniqueCategories = await Product.distinct('category')

    console.log(`Found ${uniqueBrands.length} unique brands:`, uniqueBrands)
    console.log(`Found ${uniqueCategories.length} unique categories:`, uniqueCategories)

    // Step 2: Create Brand documents for brands that don't exist
    const existingBrands = await Brand.find({}).lean()
    const existingBrandNames = existingBrands.map(b => b.name)
    
    const brandsToCreate = uniqueBrands.filter(brand => 
      typeof brand === 'string' && !existingBrandNames.includes(brand)
    )

    if (brandsToCreate.length > 0) {
      console.log(`Creating ${brandsToCreate.length} new brands:`, brandsToCreate)
      const newBrands = brandsToCreate.map(name => ({ name, active: true }))
      await Brand.insertMany(newBrands)
    }

    // Step 3: Create Category documents for categories that don't exist
    const existingCategories = await Category.find({}).lean()
    const existingCategoryNames = existingCategories.map(c => c.name)
    
    const categoriesToCreate = uniqueCategories.filter(category => 
      typeof category === 'string' && !existingCategoryNames.includes(category)
    )

    if (categoriesToCreate.length > 0) {
      console.log(`Creating ${categoriesToCreate.length} new categories:`, categoriesToCreate)
      const newCategories = categoriesToCreate.map(name => ({ name, active: true }))
      await Category.insertMany(newCategories)
    }

    // Step 4: Get all brands and categories with their ObjectIds
    const allBrands = await Brand.find({}).lean()
    const allCategories = await Category.find({}).lean()

    const brandMap = new Map(allBrands.map(b => [b.name, b._id]))
    const categoryMap = new Map(allCategories.map(c => [c.name, c._id]))

    // Step 5: Update all products to use ObjectId references
    const products = await Product.find({}).lean()
    console.log(`Updating ${products.length} products...`)

    let updatedCount = 0
    for (const product of products) {
      const updates: any = {}
      
      // Update brand if it's a string
      if (typeof product.brand === 'string') {
        const brandId = brandMap.get(product.brand)
        if (brandId) {
          updates.brand = brandId
        } else {
          console.warn(`Brand not found for product ${product.name}: ${product.brand}`)
        }
      }

      // Update category if it's a string
      if (typeof product.category === 'string') {
        const categoryId = categoryMap.get(product.category)
        if (categoryId) {
          updates.category = categoryId
        } else {
          console.warn(`Category not found for product ${product.name}: ${product.category}`)
        }
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await Product.findByIdAndUpdate(product._id, updates)
        updatedCount++
      }
    }

    console.log(`Migration completed successfully!`)
    console.log(`- Created ${brandsToCreate.length} new brands`)
    console.log(`- Created ${categoriesToCreate.length} new categories`)
    console.log(`- Updated ${updatedCount} products`)
    
    return {
      success: true,
      brandsCreated: brandsToCreate.length,
      categoriesCreated: categoriesToCreate.length,
      productsUpdated: updatedCount
    }

  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateBrandCategoryReferences()
    .then(() => {
      console.log('Migration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration script failed:', error)
      process.exit(1)
    })
}

export default migrateBrandCategoryReferences
