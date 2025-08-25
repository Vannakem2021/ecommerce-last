#!/usr/bin/env node

/**
 * Real-time monitoring script for ABA PayWay callbacks
 * This script helps track callback attempts and payment flows
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
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

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : require('http');
    
    const req = client.request(url, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        ...options.headers
      },
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function checkCallbackEndpoint() {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  
  console.log('🔍 Monitoring ABA PayWay Callback System');
  console.log('========================================');
  console.log(`Server URL: ${serverUrl}`);
  console.log(`Callback URL: ${serverUrl}/api/aba-payway/callback`);
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  // Test callback endpoint accessibility
  try {
    const response = await makeRequest(`${serverUrl}/api/aba-payway/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'test=monitor_check'
    });
    
    if (response.status === 400) {
      console.log('✅ Callback endpoint is accessible and responding');
    } else {
      console.log(`⚠️ Unexpected response: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Callback endpoint not accessible:', error.message);
  }
}

async function monitorOrderStatus() {
  console.log('\n📊 Current Order Status Summary');
  console.log('===============================');
  
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  
  // Check a few recent orders
  const orderIds = [
    '68ab28cddf5d0311dd8e2d6d', // Most recent
    '68ab282adf5d0311dd8e2ac1',
    '68ab275fdf5d0311dd8e2945',
    '68ab24d5df5d0311dd8e264e',
  ];
  
  for (const orderId of orderIds) {
    try {
      const response = await makeRequest(`${serverUrl}/api/aba-payway/test-callback?orderId=${orderId}`);
      
      if (response.status === 200) {
        const data = JSON.parse(response.body);
        const order = data.order;
        
        console.log(`Order ${orderId.slice(-8)}:`);
        console.log(`  Status: ${order.isPaid ? '✅ PAID' : '❌ UNPAID'}`);
        console.log(`  Merchant Ref: ${order.abaMerchantRefNo}`);
        console.log(`  Payment Status: ${order.abaPaymentStatus || 'unknown'}`);
        console.log(`  Callback Received: ${order.abaCallbackReceived ? 'Yes' : 'No'}`);
        console.log(`  Amount: $${order.totalPrice}`);
        console.log('');
      }
    } catch (error) {
      console.log(`❌ Error checking order ${orderId}: ${error.message}`);
    }
  }
}

async function testCallbackFlow() {
  console.log('🧪 Testing Callback Flow');
  console.log('========================');
  
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  
  // Test with a known unpaid order
  const testOrderId = '68ab282adf5d0311dd8e2ac1';
  
  try {
    // Get order details first
    const orderResponse = await makeRequest(`${serverUrl}/api/aba-payway/test-callback?orderId=${testOrderId}`);
    
    if (orderResponse.status === 200) {
      const orderData = JSON.parse(orderResponse.body);
      const order = orderData.order;
      
      console.log(`Testing with Order: ${testOrderId}`);
      console.log(`  Current Status: ${order.isPaid ? 'PAID' : 'UNPAID'}`);
      console.log(`  Merchant Ref: ${order.abaMerchantRefNo}`);
      console.log(`  Amount: $${order.totalPrice}`);
      
      if (!order.isPaid) {
        console.log('\n🔄 Simulating successful payment callback...');
        
        // Simulate callback
        const callbackResponse = await makeRequest(`${serverUrl}/api/aba-payway/test-callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: testOrderId,
            status: '0',
            amount: order.totalPrice.toString()
          })
        });
        
        if (callbackResponse.status === 200) {
          console.log('✅ Callback simulation successful');
          
          // Check updated status
          const updatedResponse = await makeRequest(`${serverUrl}/api/aba-payway/test-callback?orderId=${testOrderId}`);
          if (updatedResponse.status === 200) {
            const updatedData = JSON.parse(updatedResponse.body);
            console.log(`  Updated Status: ${updatedData.order.isPaid ? '✅ PAID' : '❌ STILL UNPAID'}`);
          }
        } else {
          console.log('❌ Callback simulation failed');
          console.log(`Response: ${callbackResponse.body}`);
        }
      } else {
        console.log('ℹ️ Order is already paid, skipping test');
      }
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

async function showInstructions() {
  console.log('\n📋 Real Payment Testing Instructions');
  console.log('====================================');
  console.log('To test with a real payment:');
  console.log('');
  console.log('1. Create a new order in your application');
  console.log('2. Initiate ABA PayWay payment');
  console.log('3. Monitor server logs for these messages:');
  console.log('   - "[ABA PayWay] Payment initiated for order..."');
  console.log('   - "[ABA PayWay] Payment parameters for order..."');
  console.log('   - "[ABA PayWay] Callback attempt received:"');
  console.log('   - "[ABA PayWay] Callback data parsed successfully:"');
  console.log('');
  console.log('4. Complete payment in ABA PayWay');
  console.log('5. Check if callback is received within 30 seconds');
  console.log('6. Verify order status updates to PAID');
  console.log('');
  console.log('🔍 Key Things to Watch For:');
  console.log('- Is the return_url correctly set to your ngrok URL?');
  console.log('- Are callbacks being received at all?');
  console.log('- Is the merchant reference number consistent?');
  console.log('- Are there any signature verification errors?');
  console.log('');
  console.log('💡 If no callbacks are received:');
  console.log('- Check ABA PayWay merchant dashboard settings');
  console.log('- Verify ngrok tunnel is still active');
  console.log('- Contact ABA PayWay support to confirm callback delivery');
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      await monitorOrderStatus();
      break;
    case 'test':
      await testCallbackFlow();
      break;
    case 'instructions':
      await showInstructions();
      break;
    default:
      await checkCallbackEndpoint();
      await monitorOrderStatus();
      await showInstructions();
  }
}

main().catch(console.error);
