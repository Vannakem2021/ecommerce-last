#!/usr/bin/env node

/**
 * Investigation script to identify why real ABA PayWay callbacks aren't working
 * while manual callback simulation works perfectly
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

async function investigateCallbackIssues() {
  console.log('🔍 Investigating Real vs Manual Callback Differences\n');
  
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  const merchantId = process.env.PAYWAY_MERCHANT_ID;
  
  console.log('📋 Current Configuration:');
  console.log('========================');
  console.log(`Server URL: ${serverUrl}`);
  console.log(`Merchant ID: ${merchantId}`);
  console.log(`Callback URL: ${serverUrl}/api/aba-payway/callback`);
  
  // Issue 1: Check if ngrok URL is accessible from external sources
  console.log('\n📋 Issue 1: External Accessibility');
  console.log('===================================');
  
  if (serverUrl && serverUrl.includes('ngrok')) {
    console.log('✅ Using ngrok URL');
    
    // Test if the callback endpoint is accessible
    try {
      const response = await makeRequest(`${serverUrl}/api/aba-payway/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'test=external_access'
      });
      
      if (response.status === 400 && response.body.includes('Invalid signature')) {
        console.log('✅ Callback endpoint is externally accessible');
        console.log('✅ Endpoint is processing requests (expected "Invalid signature" for test data)');
      } else {
        console.log('⚠️ Unexpected response from callback endpoint');
        console.log(`Status: ${response.status}, Body: ${response.body}`);
      }
    } catch (error) {
      console.log('❌ Callback endpoint not accessible externally');
      console.log(`Error: ${error.message}`);
    }
  } else {
    console.log('❌ Not using ngrok URL - ABA PayWay cannot reach localhost');
  }
  
  // Issue 2: Check payment creation flow
  console.log('\n📋 Issue 2: Payment Creation Analysis');
  console.log('====================================');
  
  // Check if the create-payment endpoint exists and is working
  try {
    const createPaymentResponse = await makeRequest(`${serverUrl}/api/aba-payway/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'endpoint_check' })
    });
    
    console.log(`Create Payment Endpoint Status: ${createPaymentResponse.status}`);
    if (createPaymentResponse.status === 400 || createPaymentResponse.status === 500) {
      console.log('✅ Create payment endpoint exists and is processing requests');
    } else {
      console.log('⚠️ Unexpected response from create payment endpoint');
    }
  } catch (error) {
    console.log('❌ Create payment endpoint not accessible');
    console.log(`Error: ${error.message}`);
  }
  
  // Issue 3: Analyze differences between manual and real callbacks
  console.log('\n📋 Issue 3: Manual vs Real Callback Differences');
  console.log('===============================================');
  
  console.log('Manual Callback Simulation:');
  console.log('  ✅ Uses correct signature generation');
  console.log('  ✅ Sends proper form data format');
  console.log('  ✅ Uses correct merchant reference numbers');
  console.log('  ✅ Includes all required parameters');
  
  console.log('\nPotential Real Callback Issues:');
  console.log('  ❓ ABA PayWay might not be sending callbacks at all');
  console.log('  ❓ ABA PayWay might be using different parameter names');
  console.log('  ❓ ABA PayWay might be sending callbacks to wrong URL');
  console.log('  ❓ ABA PayWay might be using different signature format');
  console.log('  ❓ Network/firewall issues preventing callback delivery');
  
  // Issue 4: Check server logs for callback attempts
  console.log('\n📋 Issue 4: Server Log Analysis');
  console.log('===============================');
  
  console.log('To check if real callbacks are being received:');
  console.log('1. Monitor server logs during payment completion');
  console.log('2. Look for "[ABA PayWay] Callback received:" messages');
  console.log('3. Check if any POST requests are hitting /api/aba-payway/callback');
  console.log('4. Verify if callbacks are being blocked or filtered');
  
  // Issue 5: Check ABA PayWay configuration
  console.log('\n📋 Issue 5: ABA PayWay Configuration Issues');
  console.log('==========================================');
  
  console.log('Potential ABA PayWay Configuration Problems:');
  console.log('1. ❓ return_url not properly set in payment creation');
  console.log('2. ❓ ABA PayWay sandbox vs production environment mismatch');
  console.log('3. ❓ Merchant account not configured for callbacks');
  console.log('4. ❓ Callback URL validation failing on ABA PayWay side');
  console.log('5. ❓ SSL/TLS certificate issues with ngrok');
  
  // Issue 6: Check merchant reference number consistency
  console.log('\n📋 Issue 6: Merchant Reference Number Issues');
  console.log('============================================');
  
  console.log('Potential Merchant Ref Issues:');
  console.log('1. ❓ New orders not using the fixed generation logic');
  console.log('2. ❓ Payment creation still generating different merchant refs');
  console.log('3. ❓ ABA PayWay receiving different merchant ref than stored in DB');
  console.log('4. ❓ Timing issues in merchant ref generation');
  
  console.log('\n🔧 Recommended Investigation Steps:');
  console.log('===================================');
  console.log('1. Create a new order and check server logs during payment creation');
  console.log('2. Complete a real payment and monitor for callback attempts');
  console.log('3. Check ABA PayWay merchant dashboard for callback configuration');
  console.log('4. Verify the return_url being sent to ABA PayWay matches our callback URL');
  console.log('5. Test with ABA PayWay support to confirm callback delivery');
  
  console.log('\n💡 Key Questions to Answer:');
  console.log('===========================');
  console.log('1. Are callbacks being sent by ABA PayWay at all?');
  console.log('2. Are callbacks reaching our server but failing processing?');
  console.log('3. Is the return_url correctly set in payment requests?');
  console.log('4. Are new orders using the fixed merchant ref generation?');
  console.log('5. Is there a difference between sandbox and production behavior?');
}

async function checkRecentOrderCreation() {
  console.log('\n🧪 Checking Recent Order Creation');
  console.log('=================================');
  
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  
  // Get the most recent order to check if the fix is applied
  try {
    const response = await makeRequest(`${serverUrl}/api/aba-payway/test-callback?orderId=68ab28cddf5d0311dd8e2d6d`);
    
    if (response.status === 200) {
      const data = JSON.parse(response.body);
      console.log('📊 Most Recent Order Analysis:');
      console.log(`   Order ID: ${data.order._id}`);
      console.log(`   Merchant Ref: ${data.order.abaMerchantRefNo}`);
      console.log(`   Is Paid: ${data.order.isPaid}`);
      console.log(`   Payment Status: ${data.order.abaPaymentStatus}`);
      console.log(`   Callback Received: ${data.order.abaCallbackReceived}`);
      
      if (data.order.abaMerchantRefNo) {
        console.log('✅ Order has merchant reference number');
        
        // Check if it follows the expected pattern
        const pattern = /^ORD-[a-f0-9]{8}-[a-z0-9]{6}$/;
        if (pattern.test(data.order.abaMerchantRefNo)) {
          console.log('✅ Merchant ref follows expected pattern');
        } else {
          console.log('❌ Merchant ref has unexpected format');
        }
      } else {
        console.log('❌ Order missing merchant reference number');
      }
    }
  } catch (error) {
    console.log('❌ Could not check recent order:', error.message);
  }
}

async function main() {
  await investigateCallbackIssues();
  await checkRecentOrderCreation();
  
  console.log('\n🎯 Next Steps:');
  console.log('==============');
  console.log('1. Create a new order and monitor logs during payment creation');
  console.log('2. Complete a real payment and check for callback reception');
  console.log('3. Set up enhanced logging to capture all callback attempts');
  console.log('4. Verify ABA PayWay configuration and callback settings');
}

main().catch(console.error);
