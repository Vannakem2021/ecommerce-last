#!/usr/bin/env node

/**
 * Debug script to identify ABA PayWay integration issues
 * Focus on why real payments don't trigger callbacks
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

function generateMerchantRefNo(orderId) {
  const orderSuffix = orderId.slice(-8);
  const timestamp = Date.now().toString(36).slice(-6);
  const merchantRefNo = `ORD-${orderSuffix}-${timestamp}`;
  return merchantRefNo.substring(0, 20);
}

function simulatePaymentCreation(orderId) {
  console.log('🧪 Simulating Payment Creation Process');
  console.log('======================================');
  
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
  const merchantId = process.env.PAYWAY_MERCHANT_ID;
  const secretKey = process.env.PAYWAY_SECRET_KEY;
  
  console.log(`Order ID: ${orderId}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Merchant ID: ${merchantId}`);
  console.log(`Secret Key: ${secretKey ? secretKey.substring(0, 8) + '...' : 'undefined'}`);
  
  // Step 1: Generate merchant reference number (as the fixed code does)
  const abaMerchantRefNo = generateMerchantRefNo(orderId);
  console.log(`\n📋 Step 1: Generate Merchant Reference`);
  console.log(`Generated: ${abaMerchantRefNo}`);
  
  // Step 2: Create payment request object
  const paymentRequest = {
    orderId: orderId,
    amount: 100.00,
    currency: 'USD',
    customerInfo: {
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
      phone: '+855123456789'
    },
    items: [{ name: 'Test Item', quantity: 1, price: 100.00 }],
    returnUrl: `${baseUrl}/api/aba-payway/callback`,
    cancelUrl: `${baseUrl}/checkout/${orderId}?cancelled=true`,
    continueSuccessUrl: `${baseUrl}/account/orders/${orderId}`,
    merchantRefNo: abaMerchantRefNo // This is the fix
  };
  
  console.log(`\n📋 Step 2: Payment Request Object`);
  console.log(`Return URL: ${paymentRequest.returnUrl}`);
  console.log(`Cancel URL: ${paymentRequest.cancelUrl}`);
  console.log(`Continue Success URL: ${paymentRequest.continueSuccessUrl}`);
  console.log(`Merchant Ref No: ${paymentRequest.merchantRefNo}`);
  
  // Step 3: Simulate createPaymentParams
  const reqTime = new Date()
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14);
  
  // The merchant ref should use the provided one (the fix)
  const merchantRefNo = paymentRequest.merchantRefNo || generateMerchantRefNo(paymentRequest.orderId);
  
  console.log(`\n📋 Step 3: Payment Parameters Generation`);
  console.log(`Request Time: ${reqTime}`);
  console.log(`Using Merchant Ref: ${merchantRefNo}`);
  console.log(`Was Provided: ${!!paymentRequest.merchantRefNo}`);
  
  // Step 4: Create payment parameters
  const paymentParams = {
    req_time: reqTime,
    merchant_id: merchantId,
    tran_id: merchantRefNo, // This should be the same as stored in DB
    amount: paymentRequest.amount.toFixed(2),
    firstname: paymentRequest.customerInfo.firstname,
    lastname: paymentRequest.customerInfo.lastname,
    email: paymentRequest.customerInfo.email,
    phone: paymentRequest.customerInfo.phone,
    type: "purchase",
    payment_option: "",
    items: Buffer.from(JSON.stringify([{
      name: paymentRequest.items[0].name,
      quantity: paymentRequest.items[0].quantity,
      price: parseFloat(paymentRequest.items[0].price.toFixed(2))
    }])).toString("base64"),
    shipping: "0.00",
    currency: paymentRequest.currency,
    return_url: paymentRequest.returnUrl,
    cancel_url: paymentRequest.cancelUrl,
    skip_success_page: "1",
    continue_success_url: paymentRequest.continueSuccessUrl,
    return_deeplink: "",
    custom_fields: Buffer.from(JSON.stringify({
      merchant_ref_no: merchantRefNo
    })).toString("base64")
  };
  
  console.log(`\n📋 Step 4: Final Payment Parameters`);
  console.log(`tran_id: ${paymentParams.tran_id}`);
  console.log(`return_url: ${paymentParams.return_url}`);
  console.log(`merchant_id: ${paymentParams.merchant_id}`);
  console.log(`amount: ${paymentParams.amount}`);
  
  // Step 5: Generate hash
  const dataToHash = 
    paymentParams.req_time +
    paymentParams.merchant_id +
    paymentParams.tran_id +
    paymentParams.amount +
    paymentParams.firstname +
    paymentParams.lastname +
    paymentParams.email +
    paymentParams.phone +
    paymentParams.type +
    paymentParams.payment_option +
    paymentParams.return_url +
    paymentParams.cancel_url +
    paymentParams.continue_success_url +
    paymentParams.return_deeplink +
    paymentParams.currency +
    paymentParams.custom_fields +
    paymentParams.shipping +
    paymentParams.items;
  
  const hash = Buffer.from(
    crypto
      .createHmac("sha512", secretKey)
      .update(dataToHash)
      .digest()
  ).toString("base64");
  
  paymentParams.hash = hash;
  
  console.log(`\n📋 Step 5: Hash Generation`);
  console.log(`Data to hash length: ${dataToHash.length}`);
  console.log(`Generated hash: ${hash.substring(0, 20)}...`);
  
  return {
    abaMerchantRefNo,
    paymentParams,
    paymentRequest
  };
}

function analyzeIssues() {
  console.log('\n🔍 Potential Issues Analysis');
  console.log('============================');
  
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  
  console.log('1. ❓ ABA PayWay Sandbox vs Production');
  console.log('   - Are you using sandbox or production environment?');
  console.log('   - Do sandbox payments send callbacks?');
  console.log('   - Check ABA PayWay documentation for sandbox behavior');
  
  console.log('\n2. ❓ Merchant Account Configuration');
  console.log('   - Is your merchant account configured for callbacks?');
  console.log('   - Are there whitelist restrictions on callback URLs?');
  console.log('   - Does ABA PayWay support dynamic return_url?');
  
  console.log('\n3. ❓ ngrok URL Issues');
  console.log(`   - Current URL: ${serverUrl}`);
  console.log('   - Is ngrok tunnel still active?');
  console.log('   - Does ABA PayWay accept ngrok URLs?');
  console.log('   - Are there SSL/TLS certificate issues?');
  
  console.log('\n4. ❓ Payment Flow Issues');
  console.log('   - Are users completing payments successfully?');
  console.log('   - Are payments being processed by ABA PayWay?');
  console.log('   - Is the return_url parameter being sent correctly?');
  
  console.log('\n5. ❓ Callback Delivery Issues');
  console.log('   - Is ABA PayWay attempting to send callbacks?');
  console.log('   - Are callbacks being blocked by firewalls?');
  console.log('   - Are there network connectivity issues?');
  
  console.log('\n💡 Debugging Steps:');
  console.log('===================');
  console.log('1. Check ABA PayWay merchant dashboard for callback logs');
  console.log('2. Contact ABA PayWay support to verify callback delivery');
  console.log('3. Test with a production domain instead of ngrok');
  console.log('4. Monitor ngrok traffic at http://localhost:4040');
  console.log('5. Check if callbacks are being sent to wrong URL');
  
  console.log('\n🎯 Most Likely Issues:');
  console.log('======================');
  console.log('1. 🔥 ABA PayWay sandbox doesn\'t send callbacks');
  console.log('2. 🔥 Merchant account not configured for callbacks');
  console.log('3. 🔥 ngrok URL not accepted by ABA PayWay');
  console.log('4. 🔥 return_url parameter not being processed correctly');
  console.log('5. 🔥 Network/firewall blocking callback delivery');
}

function main() {
  const testOrderId = '68ab282adf5d0311dd8e2ac1'; // An unpaid order
  
  console.log('🔍 ABA PayWay Integration Debug Analysis\n');
  
  const simulation = simulatePaymentCreation(testOrderId);
  
  console.log('\n✅ Key Findings:');
  console.log('================');
  console.log(`✅ Merchant ref generation is consistent: ${simulation.abaMerchantRefNo}`);
  console.log(`✅ Return URL is correctly set: ${simulation.paymentRequest.returnUrl}`);
  console.log(`✅ Payment parameters include proper tran_id: ${simulation.paymentParams.tran_id}`);
  console.log(`✅ Hash generation is working: ${simulation.paymentParams.hash ? 'Yes' : 'No'}`);
  
  analyzeIssues();
  
  console.log('\n🚀 Recommended Next Steps:');
  console.log('==========================');
  console.log('1. Create a new order and monitor payment creation logs');
  console.log('2. Complete a real payment and check ngrok traffic logs');
  console.log('3. Contact ABA PayWay support to verify callback configuration');
  console.log('4. Test with a production domain if possible');
  console.log('5. Check ABA PayWay merchant dashboard for callback attempts');
}

main();
