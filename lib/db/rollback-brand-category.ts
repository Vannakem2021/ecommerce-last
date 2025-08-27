/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDatabase } from '.'
import Product from './models/product.model'
import Brand from './models/brand.model'
import Category from './models/category.model'
import { cwd } from 'process'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(cwd())

/**
 * Rollback script to convert ObjectId brand/category references back to string references
 * This script can be used to revert the migration if needed
 */
const rollbackBrandCategoryReferences = async () => {
  try {
    console.log('Starting brand/category rollback...')
    await connectToDatabase(process.env.MONGODB_URI)

    // Get all brands and categories with their ObjectIds
    const allBrands = await Brand.find({}).lean()
    const allCategories = await Category.find({}).lean()

    const brandMap = new Map(allBrands.map(b => [b._id.toString(), b.name]))
    const categoryMap = new Map(allCategories.map(c => [c._id.toString(), c.name]))

    // Update all products to use string references
    const products = await Product.find({}).lean()
    console.log(`Rolling back ${products.length} products...`)

    let updatedCount = 0
    for (const product of products) {
      const updates: any = {}
      
      // Update brand if it's an ObjectId
      if (product.brand && typeof product.brand === 'object') {
        const brandName = brandMap.get(product.brand.toString())
        if (brandName) {
          updates.brand = brandName
        } else {
          console.warn(`Brand name not found for product ${product.name}: ${product.brand}`)
        }
      }

      // Update category if it's an ObjectId
      if (product.category && typeof product.category === 'object') {
        const categoryName = categoryMap.get(product.category.toString())
        if (categoryName) {
          updates.category = categoryName
        } else {
          console.warn(`Category name not found for product ${product.name}: ${product.category}`)
        }
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await Product.findByIdAndUpdate(product._id, updates)
        updatedCount++
      }
    }

    console.log(`Rollback completed successfully!`)
    console.log(`- Updated ${updatedCount} products back to string references`)
    
    return {
      success: true,
      productsUpdated: updatedCount
    }

  } catch (error) {
    console.error('Rollback failed:', error)
    throw error
  }
}

// Run rollback if this file is executed directly
if (require.main === module) {
  rollbackBrandCategoryReferences()
    .then(() => {
      console.log('Rollback script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Rollback script failed:', error)
      process.exit(1)
    })
}

export default rollbackBrandCategoryReferences
