#!/usr/bin/env node

/**
 * Script to check ABA PayWay orders consistency and fix merchant reference numbers
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.log('Could not load .env.local file:', error.message);
  }
}

loadEnvFile();

function generateMerchantRefNo(orderId) {
  // This should match the logic in lib/aba-payway.ts
  const orderSuffix = orderId.slice(-8);
  const timestamp = Date.now().toString(36).slice(-6);
  const merchantRefNo = `ORD-${orderSuffix}-${timestamp}`;
  return merchantRefNo.substring(0, 20);
}

async function checkOrdersConsistency() {
  console.log('🔍 Checking ABA PayWay Orders Consistency\n');
  
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const ordersCollection = db.collection('orders');
    
    // Find all ABA PayWay orders
    const abaOrders = await ordersCollection.find({
      paymentMethod: 'ABA PayWay'
    }).toArray();
    
    console.log(`📊 Found ${abaOrders.length} ABA PayWay orders\n`);
    
    let ordersWithMerchantRef = 0;
    let ordersWithoutMerchantRef = 0;
    let ordersWithInconsistentRef = 0;
    
    console.log('📋 Order Analysis:');
    console.log('==================');
    
    for (const order of abaOrders) {
      const orderId = order._id.toString();
      const abaMerchantRefNo = order.abaMerchantRefNo;
      const isPaid = order.isPaid;
      const paymentStatus = order.abaPaymentStatus || 'unknown';
      
      console.log(`\nOrder ID: ${orderId}`);
      console.log(`  isPaid: ${isPaid}`);
      console.log(`  paymentStatus: ${paymentStatus}`);
      console.log(`  abaMerchantRefNo: ${abaMerchantRefNo || 'NOT SET'}`);
      
      if (abaMerchantRefNo) {
        ordersWithMerchantRef++;
        
        // Check if the merchant ref follows the expected pattern
        const expectedPattern = /^ORD-[a-f0-9]{8}-[a-z0-9]{6}$/;
        if (expectedPattern.test(abaMerchantRefNo)) {
          console.log(`  ✅ Valid merchant ref format`);
        } else {
          console.log(`  ⚠️ Unexpected merchant ref format`);
          ordersWithInconsistentRef++;
        }
        
        // Check if the order suffix matches
        const orderSuffix = orderId.slice(-8);
        if (abaMerchantRefNo.includes(orderSuffix)) {
          console.log(`  ✅ Order suffix matches (${orderSuffix})`);
        } else {
          console.log(`  ❌ Order suffix mismatch (expected: ${orderSuffix})`);
          ordersWithInconsistentRef++;
        }
      } else {
        ordersWithoutMerchantRef++;
        console.log(`  ❌ Missing abaMerchantRefNo`);
      }
      
      // Show recent orders first
      if (order.createdAt) {
        console.log(`  Created: ${new Date(order.createdAt).toISOString()}`);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log('===========');
    console.log(`Total ABA PayWay orders: ${abaOrders.length}`);
    console.log(`Orders with merchant ref: ${ordersWithMerchantRef}`);
    console.log(`Orders without merchant ref: ${ordersWithoutMerchantRef}`);
    console.log(`Orders with inconsistent ref: ${ordersWithInconsistentRef}`);
    
    // Show the most recent orders
    const recentOrders = abaOrders
      .filter(order => order.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    
    console.log('\n📅 Most Recent Orders:');
    console.log('======================');
    recentOrders.forEach((order, index) => {
      console.log(`${index + 1}. ${order._id} (${order.abaMerchantRefNo || 'NO REF'}) - ${order.isPaid ? 'PAID' : 'UNPAID'}`);
    });
    
    if (ordersWithoutMerchantRef > 0) {
      console.log('\n⚠️ Issues Found:');
      console.log(`${ordersWithoutMerchantRef} orders are missing abaMerchantRefNo`);
      console.log('These orders will not work with the callback system');
      console.log('\n🔧 Recommendations:');
      console.log('1. For new orders: The fix is already implemented');
      console.log('2. For existing orders: They need to be recreated or manually fixed');
      console.log('3. Test with a new order to verify the fix works');
    }
    
    if (ordersWithInconsistentRef > 0) {
      console.log(`\n⚠️ ${ordersWithInconsistentRef} orders have inconsistent merchant reference numbers`);
      console.log('These may have been affected by the timestamp bug');
    }
    
    if (ordersWithMerchantRef > 0 && ordersWithInconsistentRef === 0) {
      console.log('\n✅ All orders with merchant references look consistent!');
    }
    
  } catch (error) {
    console.error('❌ Error checking orders:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

async function testMerchantRefGeneration() {
  console.log('\n🧪 Testing Merchant Reference Generation');
  console.log('=========================================');
  
  const testOrderId = '68ab24d5df5d0311dd8e264e';
  
  console.log(`Test Order ID: ${testOrderId}`);
  
  // Generate multiple merchant refs to show the timestamp issue
  console.log('\nGenerating merchant refs (showing timestamp variation):');
  for (let i = 0; i < 3; i++) {
    const merchantRef = generateMerchantRefNo(testOrderId);
    console.log(`  ${i + 1}. ${merchantRef}`);
    
    // Small delay to show timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n⚠️ Notice: Each generation produces a different timestamp!');
  console.log('This is why the bug occurred - different timestamps for same order.');
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  if (command === 'test-generation') {
    await testMerchantRefGeneration();
  } else {
    await checkOrdersConsistency();
    await testMerchantRefGeneration();
  }
}

main().catch(console.error);
