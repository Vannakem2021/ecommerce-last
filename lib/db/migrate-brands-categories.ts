'use server'

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import Brand from '@/lib/db/models/brand.model'
import Category from '@/lib/db/models/category.model'

export async function migrateBrandsAndCategories() {
  try {
    await connectToDatabase()
    
    console.log('Starting migration of brands and categories...')
    
    // Get all unique brands and categories from existing products
    const uniqueBrands = await Product.distinct('brand')
    const uniqueCategories = await Product.distinct('category')
    
    console.log(`Found ${uniqueBrands.length} unique brands`)
    console.log(`Found ${uniqueCategories.length} unique categories`)
    
    // Create Brand documents
    const brandPromises = uniqueBrands.map(async (brandName: string) => {
      const existingBrand = await Brand.findOne({ name: brandName })
      if (!existingBrand) {
        return Brand.create({
          name: brandName,
          active: true,
        })
      }
      return existingBrand
    })

    // Create Category documents
    const categoryPromises = uniqueCategories.map(async (categoryName: string) => {
      const existingCategory = await Category.findOne({ name: categoryName })
      if (!existingCategory) {
        return Category.create({
          name: categoryName,
          active: true,
        })
      }
      return existingCategory
    })
    
    // Wait for all brands and categories to be created
    const createdBrands = await Promise.all(brandPromises)
    const createdCategories = await Promise.all(categoryPromises)
    
    console.log(`Created/found ${createdBrands.length} brands`)
    console.log(`Created/found ${createdCategories.length} categories`)
    
    // Create lookup maps for quick reference
    const brandMap = new Map()
    const categoryMap = new Map()
    
    createdBrands.forEach(brand => {
      brandMap.set(brand.name, brand._id)
    })
    
    createdCategories.forEach(category => {
      categoryMap.set(category.name, category._id)
    })
    
    console.log('Migration completed successfully!')
    
    return {
      success: true,
      message: `Migration completed. Created ${createdBrands.length} brands and ${createdCategories.length} categories.`,
      brandMap,
      categoryMap,
    }
    
  } catch (error) {
    console.error('Migration failed:', error)
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// Function to update products with new brand and category references
export async function updateProductReferences() {
  try {
    await connectToDatabase()
    
    console.log('Starting product reference updates...')
    
    // Get all products
    const products = await Product.find({})
    console.log(`Found ${products.length} products to update`)
    
    let updatedCount = 0
    
    for (const product of products) {
      // Find corresponding brand and category
      const brand = await Brand.findOne({ name: product.brand })
      const category = await Category.findOne({ name: product.category })
      
      if (brand && category) {
        // Update product with ObjectId references
        await Product.findByIdAndUpdate(product._id, {
          brand: brand._id,
          category: category._id,
        })
        updatedCount++
      } else {
        console.warn(`Could not find brand or category for product: ${product.name}`)
      }
    }
    
    console.log(`Updated ${updatedCount} products with new references`)
    
    return {
      success: true,
      message: `Updated ${updatedCount} products with new brand and category references.`,
    }
    
  } catch (error) {
    console.error('Product reference update failed:', error)
    return {
      success: false,
      message: `Product reference update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// Complete migration function that runs both steps
export async function runCompleteMigration() {
  console.log('Starting complete migration process...')
  
  // Step 1: Migrate brands and categories
  const migrationResult = await migrateBrandsAndCategories()
  if (!migrationResult.success) {
    return migrationResult
  }
  
  // Step 2: Update product references (commented out for now to prevent data corruption)
  // const updateResult = await updateProductReferences()
  // if (!updateResult.success) {
  //   return updateResult
  // }
  
  return {
    success: true,
    message: 'Complete migration process finished successfully. Product references not updated yet - run updateProductReferences() separately when ready.',
  }
}
