'use server'

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'

interface MigrationResult {
  success: boolean
  message: string
  migratedCount: number
  errors: string[]
}

export async function migrateProductSales(dryRun: boolean = false): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    message: '',
    migratedCount: 0,
    errors: []
  }

  try {
    await connectToDatabase()
    
    // Find all products with 'todays-deal' tag
    const productsWithTodaysDeal = await Product.find({
      tags: { $in: ['todays-deal'] }
    })

    console.log(`Found ${productsWithTodaysDeal.length} products with 'todays-deal' tag`)

    if (productsWithTodaysDeal.length === 0) {
      result.success = true
      result.message = 'No products found with todays-deal tag'
      return result
    }

    if (dryRun) {
      result.success = true
      result.message = `DRY RUN: Would migrate ${productsWithTodaysDeal.length} products`
      result.migratedCount = productsWithTodaysDeal.length
      return result
    }

    // Set sale dates for each product
    const now = new Date()
    const saleEndDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days from now

    for (const product of productsWithTodaysDeal) {
      try {
        // Remove 'todays-deal' from tags array
        const updatedTags = product.tags.filter((tag: string) => tag !== 'todays-deal')
        
        // Update the product
        await Product.findByIdAndUpdate(
          product._id,
          {
            $set: {
              saleStartDate: now,
              saleEndDate: saleEndDate,
              tags: updatedTags
            }
          }
        )

        result.migratedCount++
        console.log(`Migrated product: ${product.name} (${product._id})`)
      } catch (error) {
        const errorMsg = `Failed to migrate product ${product.name}: ${error}`
        result.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    result.success = result.errors.length === 0
    result.message = result.success 
      ? `Successfully migrated ${result.migratedCount} products`
      : `Migrated ${result.migratedCount} products with ${result.errors.length} errors`

    return result
  } catch (error) {
    result.success = false
    result.message = `Migration failed: ${error}`
    result.errors.push(String(error))
    console.error('Migration error:', error)
    return result
  }
}

export async function rollbackProductSalesMigration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    message: '',
    migratedCount: 0,
    errors: []
  }

  try {
    await connectToDatabase()
    
    // Find all products with sale dates set
    const productsWithSaleDates = await Product.find({
      $or: [
        { saleStartDate: { $exists: true } },
        { saleEndDate: { $exists: true } }
      ]
    })

    console.log(`Found ${productsWithSaleDates.length} products with sale dates`)

    if (productsWithSaleDates.length === 0) {
      result.success = true
      result.message = 'No products found with sale dates'
      return result
    }

    for (const product of productsWithSaleDates) {
      try {
        // Add 'todays-deal' back to tags if it's not already there
        const updatedTags = product.tags.includes('todays-deal') 
          ? product.tags 
          : [...product.tags, 'todays-deal']
        
        // Remove sale dates and restore todays-deal tag
        await Product.findByIdAndUpdate(
          product._id,
          {
            $unset: {
              saleStartDate: 1,
              saleEndDate: 1
            },
            $set: {
              tags: updatedTags
            }
          }
        )

        result.migratedCount++
        console.log(`Rolled back product: ${product.name} (${product._id})`)
      } catch (error) {
        const errorMsg = `Failed to rollback product ${product.name}: ${error}`
        result.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    result.success = result.errors.length === 0
    result.message = result.success 
      ? `Successfully rolled back ${result.migratedCount} products`
      : `Rolled back ${result.migratedCount} products with ${result.errors.length} errors`

    return result
  } catch (error) {
    result.success = false
    result.message = `Rollback failed: ${error}`
    result.errors.push(String(error))
    console.error('Rollback error:', error)
    return result
  }
}
