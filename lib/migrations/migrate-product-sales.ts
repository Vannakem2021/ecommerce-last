'use server'

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'

/**
 * Migration utility for transitioning from tag-based sales to simplified time-based sales
 *
 * SIMPLIFIED APPROACH:
 * - Products use saleStartDate and saleEndDate for time-based sales
 * - No complex salePrice field - regular price is used
 * - Today's deals are determined by active sale periods (current date within sale window)
 * - Migration converts 'todays-deal' tags to actual sale periods
 */

interface MigrationResult {
  success: boolean
  message: string
  migratedCount: number
  errors: string[]
}

/**
 * Migrates products from tag-based 'todays-deal' system to simplified time-based sales
 *
 * This migration:
 * 1. Finds products with 'todays-deal' tag
 * 2. Sets saleStartDate (now) and saleEndDate (30 days from now)
 * 3. Removes the 'todays-deal' tag
 * 4. Products become eligible for Today's Deals through time-based logic
 *
 * @param dryRun - If true, only previews changes without applying them
 * @returns Migration result with success status and details
 */
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

    // Set sale period for each product (simplified approach - no salePrice needed)
    const now = new Date()
    const saleEndDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days from now

    for (const product of productsWithTodaysDeal) {
      try {
        // Remove 'todays-deal' from tags array
        const updatedTags = product.tags.filter((tag: string) => tag !== 'todays-deal')

        // Update the product with time-based sale logic (no salePrice needed)
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

/**
 * Rolls back the simplified sales migration by restoring 'todays-deal' tags
 *
 * This rollback:
 * 1. Finds products with sale dates set
 * 2. Removes saleStartDate and saleEndDate fields
 * 3. Restores the 'todays-deal' tag
 *
 * @returns Rollback result with success status and details
 */
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
