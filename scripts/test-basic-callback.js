#!/usr/bin/env node

/**
 * Simple test script for the basic ABA PayWay callback system
 * 
 * This script tests:
 * 1. Basic callback endpoint functionality
 * 2. return_url parameter configuration
 * 3. Simple payment status updates
 */

const fs = require('fs');
const path = require('path');

class BasicCallbackTester {
  constructor() {
    this.testResults = {
      callbackEndpoint: false,
      returnUrlConfig: false,
      paymentCreation: false,
      statusComponent: false
    };
  }

  validateCallbackEndpoint() {
    console.log('📋 Testing Basic Callback Endpoint...');
    
    try {
      const callbackPath = path.join(process.cwd(), 'app/api/aba-payway/callback/route.ts');
      const callbackContent = fs.readFileSync(callbackPath, 'utf8');
      
      // Check for basic callback functionality
      const hasPostMethod = callbackContent.includes('export async function POST');
      const hasFormDataParsing = callbackContent.includes('req.formData()');
      const hasSignatureVerification = callbackContent.includes('verifyCallback');
      const hasOrderLookup = callbackContent.includes('Order.findOne');
      const hasStatusProcessing = callbackContent.includes('ABA_PAYWAY_STATUS_CODES.SUCCESS');
      const hasOrderUpdate = callbackContent.includes('updateOrderToPaid');
      
      // Check that complex auto-polling is removed
      const hasNoAutoPolling = !callbackContent.includes('abaPayWayAutoStatusService');
      const hasNoComplexError = !callbackContent.includes('ABAPayWayErrorHandler');
      
      if (hasPostMethod && hasFormDataParsing && hasSignatureVerification && 
          hasOrderLookup && hasStatusProcessing && hasOrderUpdate && 
          hasNoAutoPolling && hasNoComplexError) {
        console.log('✅ Callback endpoint properly simplified');
        this.testResults.callbackEndpoint = true;
      } else {
        console.log('❌ Callback endpoint missing required features or not properly simplified');
        console.log('  - POST method:', hasPostMethod);
        console.log('  - FormData parsing:', hasFormDataParsing);
        console.log('  - Signature verification:', hasSignatureVerification);
        console.log('  - Order lookup:', hasOrderLookup);
        console.log('  - Status processing:', hasStatusProcessing);
        console.log('  - Order update:', hasOrderUpdate);
        console.log('  - No auto-polling:', hasNoAutoPolling);
        console.log('  - No complex error handling:', hasNoComplexError);
      }
    } catch (error) {
      console.log('❌ Error testing callback endpoint:', error.message);
    }
  }

  validateReturnUrlConfig() {
    console.log('\n📋 Testing return_url Configuration...');
    
    try {
      const createPaymentPath = path.join(process.cwd(), 'app/api/aba-payway/create-payment/route.ts');
      const createPaymentContent = fs.readFileSync(createPaymentPath, 'utf8');
      
      // Check for return_url configuration
      const hasReturnUrl = createPaymentContent.includes('returnUrl: `${baseUrl}/api/aba-payway/callback`');
      const hasBaseUrl = createPaymentContent.includes('process.env.NEXT_PUBLIC_SERVER_URL');
      const hasMerchantRefNo = createPaymentContent.includes('abaMerchantRefNo');
      
      // Check that auto-polling is removed
      const hasNoAutoPolling = !createPaymentContent.includes('abaPayWayAutoStatusService');
      
      if (hasReturnUrl && hasBaseUrl && hasMerchantRefNo && hasNoAutoPolling) {
        console.log('✅ return_url properly configured and simplified');
        this.testResults.returnUrlConfig = true;
      } else {
        console.log('❌ return_url configuration issues');
        console.log('  - Return URL set:', hasReturnUrl);
        console.log('  - Base URL configured:', hasBaseUrl);
        console.log('  - Merchant ref number:', hasMerchantRefNo);
        console.log('  - No auto-polling:', hasNoAutoPolling);
      }
    } catch (error) {
      console.log('❌ Error testing return_url config:', error.message);
    }
  }

  validatePaymentCreation() {
    console.log('\n📋 Testing Payment Creation Simplification...');
    
    try {
      const createPaymentPath = path.join(process.cwd(), 'app/api/aba-payway/create-payment/route.ts');
      const createPaymentContent = fs.readFileSync(createPaymentPath, 'utf8');
      
      // Check for simplified payment creation
      const hasABAService = createPaymentContent.includes('abaPayWayService');
      const hasPaymentParams = createPaymentContent.includes('createPaymentParams');
      const hasPaymentUrl = createPaymentContent.includes('getPaymentUrl');
      const hasOrderUpdate = createPaymentContent.includes('Order.findByIdAndUpdate');
      
      // Check that complex features are removed
      const hasNoAutoPolling = !createPaymentContent.includes('startPollingForOrder');
      const hasNoComplexImports = !createPaymentContent.includes('abaPayWayAutoStatusService');
      
      if (hasABAService && hasPaymentParams && hasPaymentUrl && hasOrderUpdate && 
          hasNoAutoPolling && hasNoComplexImports) {
        console.log('✅ Payment creation properly simplified');
        this.testResults.paymentCreation = true;
      } else {
        console.log('❌ Payment creation not properly simplified');
        console.log('  - ABA service:', hasABAService);
        console.log('  - Payment params:', hasPaymentParams);
        console.log('  - Payment URL:', hasPaymentUrl);
        console.log('  - Order update:', hasOrderUpdate);
        console.log('  - No auto-polling:', hasNoAutoPolling);
        console.log('  - No complex imports:', hasNoComplexImports);
      }
    } catch (error) {
      console.log('❌ Error testing payment creation:', error.message);
    }
  }

  validateStatusComponent() {
    console.log('\n📋 Testing Status Component Simplification...');
    
    try {
      const statusComponentPath = path.join(process.cwd(), 'components/aba-payway/payment-status.tsx');
      const statusComponentContent = fs.readFileSync(statusComponentPath, 'utf8');
      
      // Check for simplified component
      const hasBasicRefresh = statusComponentContent.includes('showRefresh');
      const hasCheckStatus = statusComponentContent.includes('checkStatus');
      const hasSimplePolling = statusComponentContent.includes('30000'); // 30 second interval
      const hasStatusDisplay = statusComponentContent.includes('getStatusIcon');
      
      // Check that complex features are removed
      const hasNoAutoPollingProp = !statusComponentContent.includes('autoPolling?:');
      const hasNoComplexPolling = !statusComponentContent.includes('startAutoPolling');
      const hasNoZapIcon = !statusComponentContent.includes('Zap');
      const hasNoPollCount = !statusComponentContent.includes('pollCount');
      
      if (hasBasicRefresh && hasCheckStatus && hasSimplePolling && hasStatusDisplay && 
          hasNoAutoPollingProp && hasNoComplexPolling && hasNoZapIcon && hasNoPollCount) {
        console.log('✅ Status component properly simplified');
        this.testResults.statusComponent = true;
      } else {
        console.log('❌ Status component not properly simplified');
        console.log('  - Basic refresh:', hasBasicRefresh);
        console.log('  - Check status:', hasCheckStatus);
        console.log('  - Simple polling:', hasSimplePolling);
        console.log('  - Status display:', hasStatusDisplay);
        console.log('  - No auto-polling prop:', hasNoAutoPollingProp);
        console.log('  - No complex polling:', hasNoComplexPolling);
        console.log('  - No Zap icon:', hasNoZapIcon);
        console.log('  - No poll count:', hasNoPollCount);
      }
    } catch (error) {
      console.log('❌ Error testing status component:', error.message);
    }
  }

  validateFileCleanup() {
    console.log('\n📋 Testing File Cleanup...');
    
    const removedFiles = [
      'lib/aba-payway-auto-status.ts',
      'lib/aba-payway-error-handler.ts',
      'app/api/aba-payway/start-auto-polling/route.ts',
      'tests/aba-payway-auto-status.test.ts',
      'scripts/test-automated-payment-status.js',
      'scripts/validate-automated-payment-status.js'
    ];

    let allFilesRemoved = true;
    removedFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`❌ ${file} - Still exists (should be removed)`);
        allFilesRemoved = false;
      } else {
        console.log(`✅ ${file} - Properly removed`);
      }
    });

    if (allFilesRemoved) {
      console.log('✅ All complex files properly removed');
    } else {
      console.log('❌ Some complex files still exist');
    }

    return allFilesRemoved;
  }

  async runAllTests() {
    console.log('🚀 Testing Basic ABA PayWay Callback System...\n');
    
    try {
      this.validateCallbackEndpoint();
      this.validateReturnUrlConfig();
      this.validatePaymentCreation();
      this.validateStatusComponent();
      const filesCleanedUp = this.validateFileCleanup();
      
      this.printResults(filesCleanedUp);
    } catch (error) {
      console.error('💥 Test suite failed:', error.message);
    }
  }

  printResults(filesCleanedUp) {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const results = [
      { name: 'Basic Callback Endpoint', passed: this.testResults.callbackEndpoint },
      { name: 'return_url Configuration', passed: this.testResults.returnUrlConfig },
      { name: 'Simplified Payment Creation', passed: this.testResults.paymentCreation },
      { name: 'Simplified Status Component', passed: this.testResults.statusComponent },
      { name: 'Complex Files Removed', passed: filesCleanedUp }
    ];

    results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.name}`);
    });

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    console.log(`\n🎯 Overall Score: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      console.log('\n🎉 All tests passed! Basic callback system is properly implemented.');
      console.log('\n📝 Next Steps:');
      console.log('1. Test with a real ABA PayWay payment');
      console.log('2. Verify the return_url callback is received');
      console.log('3. Check that payment status updates correctly');
      console.log('4. Monitor the simple 30-second auto-refresh');
      console.log('\n💡 Key Benefits:');
      console.log('- Simple, reliable callback-based system');
      console.log('- Uses ABA PayWay recommended return_url approach');
      console.log('- No complex background jobs or polling');
      console.log('- Basic 30-second auto-refresh for pending payments');
      console.log('- Manual refresh button for immediate updates');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the implementation.');
      console.log('\n🔧 Recommended Actions:');
      
      if (!this.testResults.callbackEndpoint) {
        console.log('- Review callback endpoint implementation');
      }
      if (!this.testResults.returnUrlConfig) {
        console.log('- Check return_url configuration in payment creation');
      }
      if (!this.testResults.paymentCreation) {
        console.log('- Simplify payment creation endpoint');
      }
      if (!this.testResults.statusComponent) {
        console.log('- Remove complex auto-polling from status component');
      }
      if (!filesCleanedUp) {
        console.log('- Remove remaining complex auto-polling files');
      }
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new BasicCallbackTester();
  tester.runAllTests().catch(console.error);
}

module.exports = { BasicCallbackTester };
