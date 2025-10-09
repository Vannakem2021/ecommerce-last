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

    // Migration is no longer needed - tags have been removed from the product model
    // Products now use saleStartDate/saleEndDate and listPrice > price for hot deals
    result.success = true
    result.message = 'Migration no longer needed - tags system has been removed. Products with listPrice > price are automatically shown as hot deals.'
    return result

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
    
    // Rollback is no longer applicable - tags system has been removed
    result.success = true
    result.message = 'Rollback no longer applicable - tags system has been removed from the product model'
    return result

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
