#!/usr/bin/env node

/**
 * Test script for the fixed ABA PayWay callback implementation
 * Based on the callback.md documentation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

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

async function testCorrectCallbackFormat() {
  console.log('🧪 Testing Fixed ABA PayWay Callback Implementation');
  console.log('===================================================\n');
  
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  const callbackUrl = `${serverUrl}/api/aba-payway/callback`;
  
  console.log(`Callback URL: ${callbackUrl}`);
  
  // Test with correct ABA PayWay pushback format (from callback.md)
  const testCases = [
    {
      name: 'Successful Payment (status: 0)',
      data: {
        tran_id: 'ORD-dd8e2ac1-ptabfe', // An unpaid order
        apv: 'ABC123456', // Approval code (not amount!)
        status: '0' // Success
      }
    },
    {
      name: 'Successful Payment (status: 00)',
      data: {
        tran_id: 'ORD-dd8e2ac1-ptabfe',
        apv: 'XYZ789012',
        status: '00' // Payment Link success
      }
    },
    {
      name: 'Failed Payment',
      data: {
        tran_id: 'ORD-dd8e2ac1-ptabfe',
        apv: '',
        status: '1' // Failed
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log(`Data: ${JSON.stringify(testCase.data)}`);
    
    try {
      // Test JSON format (as per callback.md)
      const response = await makeRequest(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(testCase.data)
      });
      
      console.log(`Response Status: ${response.status}`);
      console.log(`Response Body: ${response.body}`);
      
      if (response.status === 200) {
        console.log('✅ Callback processed successfully');
        
        // Check if order was updated for successful payments
        if (testCase.data.status === '0' || testCase.data.status === '00') {
          console.log('🔍 Checking if order was marked as paid...');
          
          // Get order ID from tran_id
          const orderIdMatch = testCase.data.tran_id.match(/ORD-([a-f0-9]{8})-/);
          if (orderIdMatch) {
            const orderSuffix = orderIdMatch[1];
            // Find the full order ID (this is a simplified approach)
            const testOrderId = '68ab282adf5d0311dd8e2ac1'; // Known order ID
            
            const statusResponse = await makeRequest(`${serverUrl}/api/aba-payway/test-callback?orderId=${testOrderId}`);
            if (statusResponse.status === 200) {
              const statusData = JSON.parse(statusResponse.body);
              console.log(`Order Status: ${statusData.order.isPaid ? '✅ PAID' : '❌ UNPAID'}`);
            }
          }
        }
      } else {
        console.log('❌ Callback failed');
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

async function testContentTypeHandling() {
  console.log('\n🧪 Testing Content-Type Handling');
  console.log('=================================');
  
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  const callbackUrl = `${serverUrl}/api/aba-payway/callback`;
  
  const testData = {
    tran_id: 'ORD-test-123456',
    apv: 'TEST123',
    status: '0'
  };
  
  const contentTypes = [
    {
      name: 'JSON (application/json)',
      contentType: 'application/json',
      body: JSON.stringify(testData)
    },
    {
      name: 'Form URL Encoded',
      contentType: 'application/x-www-form-urlencoded',
      body: new URLSearchParams(testData).toString()
    },
    {
      name: 'No Content-Type (fallback to JSON)',
      contentType: '',
      body: JSON.stringify(testData)
    }
  ];
  
  for (const test of contentTypes) {
    console.log(`\n📋 Testing: ${test.name}`);
    
    try {
      const response = await makeRequest(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': test.contentType,
          'ngrok-skip-browser-warning': 'true'
        },
        body: test.body
      });
      
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${response.body.substring(0, 100)}...`);
      
      if (response.status === 200) {
        console.log('✅ Content-Type handled correctly');
      } else {
        console.log('⚠️ Unexpected response');
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

async function main() {
  const command = process.argv[2];
  
  if (command === 'content-types') {
    await testContentTypeHandling();
  } else {
    await testCorrectCallbackFormat();
    await testContentTypeHandling();
  }
  
  console.log('\n🎯 Key Fixes Applied:');
  console.log('=====================');
  console.log('✅ Fixed content-type parsing (JSON support)');
  console.log('✅ Removed invalid signature verification');
  console.log('✅ Fixed apv interpretation (approval code, not amount)');
  console.log('✅ Added proper status normalization (0 and 00 for success)');
  console.log('✅ Removed amount verification from pushback');
  
  console.log('\n💡 Next Steps:');
  console.log('==============');
  console.log('1. Test with a real ABA PayWay payment');
  console.log('2. Monitor server logs for callback reception');
  console.log('3. Verify that orders update correctly');
  console.log('4. Contact ABA PayWay if callbacks still not received');
}

main().catch(console.error);
