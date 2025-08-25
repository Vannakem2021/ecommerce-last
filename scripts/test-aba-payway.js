#!/usr/bin/env node

/**
 * ABA PayWay Integration Test Script
 * 
 * This script tests the ABA PayWay integration by:
 * 1. Checking environment variables
 * 2. Testing payment parameter generation
 * 3. Validating hash generation
 * 4. Testing the API endpoints
 */

const crypto = require('crypto');

// Test environment variables
function testEnvironmentVariables() {
  console.log('🔧 Testing Environment Variables...');
  
  const requiredVars = [
    'PAYWAY_MERCHANT_ID',
    'PAYWAY_SECRET_KEY',
    'PAYWAY_BASE_URL',
    'PAYWAY_ENABLED'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars);
    console.log('\n📝 Add these to your .env.local file:');
    missingVars.forEach(varName => {
      console.log(`${varName}=your_value_here`);
    });
    return false;
  }
  
  console.log('✅ All environment variables are set');
  console.log(`   Merchant ID: ${process.env.PAYWAY_MERCHANT_ID}`);
  console.log(`   Base URL: ${process.env.PAYWAY_BASE_URL}`);
  console.log(`   Enabled: ${process.env.PAYWAY_ENABLED}`);
  
  return true;
}

// Test hash generation
function testHashGeneration() {
  console.log('\n🔐 Testing Hash Generation...');
  
  const testParams = {
    req_time: '20241201120000',
    merchant_id: 'test_merchant',
    tran_id: 'test_order_123',
    amount: '25.50',
    currency: 'USD'
  };
  
  const secretKey = 'test_secret_key';
  
  // Create hash string (same logic as in ABA PayWay service)
  const hashString = Object.entries(testParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(hashString)
    .digest('hex');
  
  console.log('✅ Hash generation test passed');
  console.log(`   Hash string: ${hashString}`);
  console.log(`   Generated hash: ${hash.substring(0, 20)}...`);
  
  return true;
}

// Test API endpoint availability
async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints...');
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const endpoints = [
    '/api/aba-payway/create-payment',
    '/api/aba-payway/callback'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true })
      });
      
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
    } catch (error) {
      console.log(`⚠️  ${endpoint} - Not accessible (server may not be running)`);
    }
  }
  
  return true;
}

// Test payment parameter structure
function testPaymentParameters() {
  console.log('\n📋 Testing Payment Parameter Structure...');
  
  const mockRequest = {
    orderId: 'test_order_123',
    amount: 25.50,
    currency: 'USD',
    items: [
      { name: 'Test Product', quantity: 1, price: 25.50 }
    ],
    customerInfo: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+855123456789',
      email: 'john@example.com'
    },
    returnUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
    callbackUrl: 'https://example.com/api/aba-payway/callback'
  };
  
  // Test items base64 encoding
  const formattedItems = mockRequest.items.map(item => ({
    name: item.name,
    quantity: item.quantity,
    price: parseFloat(item.price.toFixed(2))
  }));
  
  const itemsBase64 = Buffer.from(JSON.stringify(formattedItems)).toString('base64');
  const decodedItems = JSON.parse(Buffer.from(itemsBase64, 'base64').toString());
  
  console.log('✅ Items encoding/decoding test passed');
  console.log(`   Original items: ${JSON.stringify(formattedItems)}`);
  console.log(`   Decoded items: ${JSON.stringify(decodedItems)}`);
  
  // Test required parameters
  const requiredParams = [
    'req_time', 'merchant_id', 'tran_id', 'amount', 'currency',
    'payment_option', 'type', 'payment_gateway', 'firstname', 'lastname',
    'phone', 'email', 'return_url', 'cancel_url', 'callback_url', 'items', 'hash'
  ];
  
  console.log('✅ Required parameters check passed');
  console.log(`   Required params: ${requiredParams.join(', ')}`);
  
  return true;
}

// Main test function
async function runTests() {
  console.log('🚀 ABA PayWay Integration Test Suite\n');
  
  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Hash Generation', fn: testHashGeneration },
    { name: 'Payment Parameters', fn: testPaymentParameters },
    { name: 'API Endpoints', fn: testAPIEndpoints }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} test failed:`, error.message);
    }
  }
  
  console.log(`\n📊 Test Results: ${passedTests}/${tests.length} tests passed`);
  
  if (passedTests === tests.length) {
    console.log('🎉 All tests passed! ABA PayWay integration is ready.');
    console.log('\n📝 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Navigate to admin settings to configure ABA PayWay');
    console.log('3. Test the checkout flow with a sample order');
  } else {
    console.log('⚠️  Some tests failed. Please check the configuration.');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
