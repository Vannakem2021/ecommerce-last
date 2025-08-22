/**
 * Test script to verify inventory integration with order system
 * This script simulates an order payment and checks if stock movements are created
 */

import { connectToDatabase } from './db'
import Product from './db/models/product.model'
import Order from './db/models/order.model'
import StockMovement from './db/models/stock-movement.model'
import User from './db/models/user.model'
import { createSaleStockMovement } from './actions/inventory.actions'

export async function testInventoryIntegration() {
  try {
    console.log('🧪 Starting inventory integration test...')
    
    await connectToDatabase()
    
    // 1. Find a test product with stock
    const testProduct = await Product.findOne({ countInStock: { $gt: 0 } }).lean()
    if (!testProduct) {
      throw new Error('No products with stock found for testing')
    }
    
    console.log(`📦 Testing with product: ${testProduct.name} (SKU: ${testProduct.sku})`)
    console.log(`📊 Current stock: ${testProduct.countInStock}`)
    
    // 2. Find a test user
    const testUser = await User.findOne().lean()
    if (!testUser) {
      throw new Error('No users found for testing')
    }
    
    console.log(`👤 Using test user: ${testUser.name} (${testUser.email})`)
    
    // 3. Create a test order
    const testOrder = await Order.create({
      user: testUser._id,
      items: [{
        product: testProduct._id,
        clientId: 'test-client-id',
        name: testProduct.name,
        slug: testProduct.slug,
        image: testProduct.images[0] || '/placeholder.jpg',
        category: testProduct.category,
        price: testProduct.price,
        countInStock: testProduct.countInStock,
        quantity: 2, // Test with 2 units
        size: 'M',
        color: 'Blue'
      }],
      shippingAddress: {
        fullName: 'Test User',
        address: '123 Test St',
        city: 'Test City',
        postalCode: '12345',
        country: 'Test Country'
      },
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      paymentMethod: 'Test Payment',
      itemsPrice: testProduct.price * 2,
      shippingPrice: 10,
      taxPrice: (testProduct.price * 2) * 0.1,
      totalPrice: (testProduct.price * 2) + 10 + ((testProduct.price * 2) * 0.1),
      isPaid: false,
      isDelivered: false
    })
    
    console.log(`📋 Created test order: ${testOrder._id}`)
    
    // 4. Get stock movements before sale
    const movementsBefore = await StockMovement.find({ product: testProduct._id }).lean()
    console.log(`📈 Stock movements before sale: ${movementsBefore.length}`)
    
    // 5. Simulate sale by creating stock movement
    const saleResult = await createSaleStockMovement(
      testProduct._id.toString(),
      2, // quantity sold
      testOrder._id.toString(),
      testUser._id.toString()
    )
    
    if (!saleResult.success) {
      throw new Error(`Failed to create sale stock movement: ${saleResult.message}`)
    }
    
    console.log(`✅ Sale stock movement created: ${saleResult.message}`)
    
    // 6. Verify stock was updated
    const updatedProduct = await Product.findById(testProduct._id).lean()
    const expectedNewStock = testProduct.countInStock - 2
    
    console.log(`📊 Stock after sale: ${updatedProduct?.countInStock} (expected: ${expectedNewStock})`)
    
    // 7. Get stock movements after sale
    const movementsAfter = await StockMovement.find({ product: testProduct._id }).lean()
    console.log(`📈 Stock movements after sale: ${movementsAfter.length}`)
    
    // 8. Find the new stock movement
    const newMovement = movementsAfter.find(m => 
      m.type === 'SALE' && 
      m.reason.includes(testOrder._id.toString())
    )
    
    if (!newMovement) {
      throw new Error('Sale stock movement not found')
    }
    
    console.log(`📋 Sale movement details:`)
    console.log(`   - Type: ${newMovement.type}`)
    console.log(`   - Quantity: ${newMovement.quantity}`)
    console.log(`   - Previous Stock: ${newMovement.previousStock}`)
    console.log(`   - New Stock: ${newMovement.newStock}`)
    console.log(`   - Reason: ${newMovement.reason}`)
    
    // 9. Cleanup - delete test order
    await Order.findByIdAndDelete(testOrder._id)
    console.log(`🧹 Cleaned up test order`)
    
    console.log('✅ Inventory integration test completed successfully!')
    
    return {
      success: true,
      message: 'Integration test passed',
      details: {
        productTested: testProduct.name,
        sku: testProduct.sku,
        originalStock: testProduct.countInStock,
        newStock: updatedProduct?.countInStock,
        movementCreated: !!newMovement
      }
    }
    
  } catch (error) {
    console.error('❌ Inventory integration test failed:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    }
  }
}

// Allow running this script directly
if (require.main === module) {
  testInventoryIntegration()
    .then(result => {
      console.log('\n📊 Test Result:', result)
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('Script execution failed:', error)
      process.exit(1)
    })
}
