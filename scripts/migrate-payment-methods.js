/**
 * Payment Method Migration Script
 * 
 * This script migrates the payment system from supporting multiple payment methods
 * (Stripe, PayPal, ABA PayWay, Cash on Delivery) to only ABA PayWay and Cash on Delivery.
 * 
 * It performs the following operations:
 * 1. Updates user payment methods from Stripe/PayPal to ABA PayWay
 * 2. Updates settings to remove Stripe/PayPal from available payment methods
 * 3. Updates default payment method to ABA PayWay
 * 4. Preserves all historical order data
 * 
 * Run this script before removing Stripe/PayPal code:
 * node scripts/migrate-payment-methods.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function migratePaymentMethods() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // 1. Migrate user payment methods
    console.log('\n=== Migrating User Payment Methods ===');
    
    const usersToUpdate = await db.collection('users').find({
      paymentMethod: { $in: ['Stripe', 'PayPal'] }
    }).toArray();
    
    console.log(`Found ${usersToUpdate.length} users with Stripe/PayPal payment methods`);
    
    if (usersToUpdate.length > 0) {
      const userUpdateResult = await db.collection('users').updateMany(
        { paymentMethod: { $in: ['Stripe', 'PayPal'] } },
        { $set: { paymentMethod: 'ABA PayWay' } }
      );
      
      console.log(`Updated ${userUpdateResult.modifiedCount} users to use ABA PayWay`);
    }
    
    // 2. Migrate settings payment methods
    console.log('\n=== Migrating Settings Payment Methods ===');
    
    const settings = await db.collection('settings').find({}).toArray();
    console.log(`Found ${settings.length} settings documents`);
    
    for (const setting of settings) {
      let needsUpdate = false;
      const updates = {};
      
      // Remove Stripe and PayPal from available payment methods
      if (setting.availablePaymentMethods) {
        const filteredMethods = setting.availablePaymentMethods.filter(
          method => method.name !== 'Stripe' && method.name !== 'PayPal'
        );
        
        if (filteredMethods.length !== setting.availablePaymentMethods.length) {
          updates.availablePaymentMethods = filteredMethods;
          needsUpdate = true;
          console.log(`Removing Stripe/PayPal from available payment methods in setting ${setting._id}`);
        }
      }
      
      // Update default payment method if it's Stripe or PayPal
      if (setting.defaultPaymentMethod === 'Stripe' || setting.defaultPaymentMethod === 'PayPal') {
        updates.defaultPaymentMethod = 'ABA PayWay';
        needsUpdate = true;
        console.log(`Updating default payment method from ${setting.defaultPaymentMethod} to ABA PayWay in setting ${setting._id}`);
      }
      
      // Apply updates if needed
      if (needsUpdate) {
        await db.collection('settings').updateOne(
          { _id: setting._id },
          { $set: updates }
        );
        console.log(`Updated setting ${setting._id}`);
      }
    }
    
    // 3. Report on order data (no changes needed, just informational)
    console.log('\n=== Order Data Analysis ===');
    
    const orderStats = await db.collection('orders').aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('Order distribution by payment method:');
    orderStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} orders, $${stat.totalValue.toFixed(2)} total value`);
    });
    
    console.log('\nNote: Historical order data is preserved and will remain accessible.');
    
    // 4. Verify migration results
    console.log('\n=== Migration Verification ===');
    
    const remainingStripePayPalUsers = await db.collection('users').countDocuments({
      paymentMethod: { $in: ['Stripe', 'PayPal'] }
    });
    
    console.log(`Users still using Stripe/PayPal: ${remainingStripePayPalUsers}`);
    
    const currentPaymentMethods = await db.collection('users').aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('Current user payment method distribution:');
    currentPaymentMethods.forEach(method => {
      console.log(`  ${method._id || 'null'}: ${method.count} users`);
    });
    
    console.log('\n✅ Payment method migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  migratePaymentMethods()
    .then(() => {
      console.log('\n🎉 Migration script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migratePaymentMethods };
