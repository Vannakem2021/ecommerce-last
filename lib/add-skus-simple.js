/**
 * Simple script to add SKUs to existing products
 * Run with: node lib/add-skus-simple.js
 */

const { MongoClient, ObjectId } = require('mongodb');

// SKU generation function
function normalizeForSKU(text) {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 10);
}

async function generateSKU(brand, category, existingSkus) {
  const normalizedBrand = normalizeForSKU(brand);
  const normalizedCategory = normalizeForSKU(category);
  const basePattern = `${normalizedBrand}-${normalizedCategory}`;
  
  // Find the highest sequence number for this brand-category combination
  let maxSequence = 0;
  const regex = new RegExp(`^${basePattern}-(\\d+)$`);
  
  for (const sku of existingSkus) {
    const match = sku.match(regex);
    if (match) {
      const sequence = parseInt(match[1], 10);
      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  }
  
  const nextSequence = (maxSequence + 1).toString().padStart(3, '0');
  return `${basePattern}-${nextSequence}`;
}

async function addSkusToProducts() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nextjs-amazona';
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db();
    const products = db.collection('products');
    const stockMovements = db.collection('stockmovements');
    const users = db.collection('users');
    
    // Find products without SKUs
    const productsWithoutSkus = await products.find({
      $or: [
        { sku: { $exists: false } },
        { sku: null },
        { sku: '' }
      ]
    }).toArray();
    
    console.log(`📦 Found ${productsWithoutSkus.length} products without SKUs`);
    
    if (productsWithoutSkus.length === 0) {
      console.log('✅ All products already have SKUs');
      return { success: true, message: 'All products already have SKUs' };
    }
    
    // Find a system user for stock movements
    const systemUser = await users.findOne({ role: 'admin' }) || await users.findOne();
    if (!systemUser) {
      throw new Error('No users found in database');
    }
    
    console.log(`👤 Using user ${systemUser.name} for stock movement records`);
    
    // Get all existing SKUs to avoid duplicates
    const existingProducts = await products.find({ sku: { $exists: true, $ne: null } }).toArray();
    const existingSkus = existingProducts.map(p => p.sku).filter(Boolean);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of productsWithoutSkus) {
      try {
        // Generate unique SKU
        const sku = await generateSKU(product.brand, product.category, existingSkus);
        existingSkus.push(sku); // Add to list to avoid duplicates in this batch
        
        // Update product with SKU
        await products.updateOne(
          { _id: product._id },
          { $set: { sku: sku } }
        );
        
        // Create initial stock movement record
        await stockMovements.insertOne({
          product: product._id,
          sku: sku,
          type: 'SET',
          quantity: product.countInStock,
          previousStock: 0,
          newStock: product.countInStock,
          reason: 'Initial stock migration',
          notes: 'Automatically created during SKU migration',
          createdBy: systemUser._id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        successCount++;
        console.log(`✅ Generated SKU ${sku} for product: ${product.name}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to process product ${product.name}: ${error.message}`);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully processed: ${successCount} products`);
    console.log(`❌ Errors: ${errorCount} products`);
    
    if (errorCount > 0) {
      return {
        success: false,
        message: `Migration completed with errors. ${successCount} products processed successfully, ${errorCount} failed.`
      };
    }
    
    console.log('\n🎉 SKU migration completed successfully!');
    return {
      success: true,
      message: `Successfully generated SKUs for ${successCount} products and created initial stock movement records.`
    };
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    return {
      success: false,
      message: `Migration failed: ${error.message}`
    };
  } finally {
    await client.close();
  }
}

// Run the migration
addSkusToProducts()
  .then(result => {
    console.log('\n📊 Migration Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
