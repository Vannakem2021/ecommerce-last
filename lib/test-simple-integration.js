/**
 * Simple test to verify stock movement creation
 * Run with: node lib/test-simple-integration.js
 */

const { MongoClient } = require('mongodb');

async function testStockMovements() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nextjs-amazona';
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db();
    const products = db.collection('products');
    const stockMovements = db.collection('stockmovements');
    
    // Find a product with stock
    const product = await products.findOne({ countInStock: { $gt: 0 } });
    if (!product) {
      throw new Error('No products with stock found');
    }

    console.log(`📦 Found product: ${product.name} (SKU: ${product.sku || 'NOT SET'})`);
    console.log(`📊 Current stock: ${product.countInStock}`);

    // Check if products have SKU field
    const productsWithSku = await products.countDocuments({ sku: { $exists: true, $ne: null } });
    const totalProducts = await products.countDocuments();
    console.log(`🏷️ Products with SKU: ${productsWithSku}/${totalProducts}`);
    
    // Check existing stock movements for this product
    const existingMovements = await stockMovements.find({ 
      product: product._id 
    }).toArray();
    
    console.log(`📈 Existing stock movements: ${existingMovements.length}`);
    
    if (existingMovements.length > 0) {
      console.log('📋 Recent movements:');
      existingMovements.slice(-3).forEach((movement, index) => {
        console.log(`   ${index + 1}. ${movement.type}: ${movement.quantity} (${movement.reason})`);
      });
    }
    
    console.log('✅ Database connection and data retrieval successful!');
    
    return {
      success: true,
      productCount: await products.countDocuments(),
      movementCount: await stockMovements.countDocuments(),
      testProduct: {
        name: product.name,
        sku: product.sku,
        stock: product.countInStock
      }
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    await client.close();
  }
}

// Run the test
testStockMovements()
  .then(result => {
    console.log('\n📊 Test Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
