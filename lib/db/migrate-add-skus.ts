import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import StockMovement from '@/lib/db/models/stock-movement.model'
import User from '@/lib/db/models/user.model'
import { generateUniqueSKU } from '@/lib/utils/sku-generator'

/**
 * Migration script to add SKUs to existing products and create initial stock movement records
 * This should be run once after adding the SKU field to the Product model
 */
export async function migrateAddSkus() {
  try {
    console.log('🚀 Starting SKU migration...')
    
    await connectToDatabase()
    
    // Find all products without SKUs
    const productsWithoutSkus = await Product.find({
      $or: [
        { sku: { $exists: false } },
        { sku: null },
        { sku: '' }
      ]
    }).lean()
    
    console.log(`📦 Found ${productsWithoutSkus.length} products without SKUs`)
    
    if (productsWithoutSkus.length === 0) {
      console.log('✅ All products already have SKUs')
      return { success: true, message: 'All products already have SKUs' }
    }
    
    // Find a system user for creating stock movement records
    // Try to find an admin user, fallback to any user
    let systemUser = await User.findOne({ role: 'admin' }).select('_id').lean()
    if (!systemUser) {
      systemUser = await User.findOne().select('_id').lean()
    }
    
    if (!systemUser) {
      throw new Error('No users found in database. Please create at least one user before running migration.')
    }
    
    console.log(`👤 Using user ${systemUser._id} for stock movement records`)
    
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []
    
    // Process products in batches to avoid memory issues
    const batchSize = 50
    for (let i = 0; i < productsWithoutSkus.length; i += batchSize) {
      const batch = productsWithoutSkus.slice(i, i + batchSize)
      
      console.log(`📝 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(productsWithoutSkus.length / batchSize)}`)
      
      for (const product of batch) {
        try {
          // Generate unique SKU
          const sku = await generateUniqueSKU(product.brand, product.category)
          
          // Update product with SKU
          await Product.findByIdAndUpdate(product._id, { sku })
          
          // Create initial stock movement record
          await StockMovement.create({
            product: product._id,
            sku,
            type: 'SET',
            quantity: product.countInStock,
            previousStock: 0,
            newStock: product.countInStock,
            reason: 'Initial stock migration',
            notes: 'Automatically created during SKU migration',
            createdBy: systemUser._id,
          })
          
          successCount++
          console.log(`✅ Generated SKU ${sku} for product: ${product.name}`)
          
        } catch (error) {
          errorCount++
          const errorMessage = `Failed to process product ${product.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMessage)
          console.error(`❌ ${errorMessage}`)
        }
      }
    }
    
    console.log('\n📊 Migration Summary:')
    console.log(`✅ Successfully processed: ${successCount} products`)
    console.log(`❌ Errors: ${errorCount} products`)
    
    if (errors.length > 0) {
      console.log('\n🚨 Errors encountered:')
      errors.forEach(error => console.log(`  - ${error}`))
    }
    
    if (errorCount > 0) {
      return {
        success: false,
        message: `Migration completed with errors. ${successCount} products processed successfully, ${errorCount} failed.`,
        errors
      }
    }
    
    console.log('\n🎉 SKU migration completed successfully!')
    return {
      success: true,
      message: `Successfully generated SKUs for ${successCount} products and created initial stock movement records.`
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('💥 Migration failed:', errorMessage)
    return {
      success: false,
      message: `Migration failed: ${errorMessage}`
    }
  }
}

/**
 * Rollback function to remove SKUs and stock movement records
 * Use with caution - this will delete data!
 */
export async function rollbackSkuMigration() {
  try {
    console.log('🔄 Starting SKU migration rollback...')
    
    await connectToDatabase()
    
    // Remove SKU field from all products
    const updateResult = await Product.updateMany(
      {},
      { $unset: { sku: 1 } }
    )
    
    // Delete all stock movement records created during migration
    const deleteResult = await StockMovement.deleteMany({
      reason: 'Initial stock migration'
    })
    
    console.log(`📦 Removed SKUs from ${updateResult.modifiedCount} products`)
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} stock movement records`)
    
    console.log('✅ Rollback completed successfully!')
    return {
      success: true,
      message: `Rollback completed. Removed SKUs from ${updateResult.modifiedCount} products and deleted ${deleteResult.deletedCount} stock movement records.`
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('💥 Rollback failed:', errorMessage)
    return {
      success: false,
      message: `Rollback failed: ${errorMessage}`
    }
  }
}

// Allow running this script directly
if (require.main === module) {
  migrateAddSkus()
    .then(result => {
      console.log(result.message)
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('Script execution failed:', error)
      process.exit(1)
    })
}
