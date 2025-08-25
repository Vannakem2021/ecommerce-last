#!/usr/bin/env node

/**
 * Diagnostic script for ABA PayWay callback processing issues
 * 
 * This script helps identify why payment status is not updating correctly
 */

const fs = require('fs');
const path = require('path');

class ABACallbackDiagnostic {
  constructor() {
    this.issues = [];
    this.recommendations = [];
  }

  async runDiagnostics() {
    console.log('🔍 ABA PayWay Callback Diagnostic Tool\n');
    
    this.checkCallbackEndpoint();
    this.checkSignatureVerification();
    this.checkOrderLookupLogic();
    this.checkUpdateOrderToPaidFunction();
    this.checkCallbackParameterHandling();
    this.checkEnvironmentConfiguration();
    
    this.printResults();
  }

  checkCallbackEndpoint() {
    console.log('📋 Checking Callback Endpoint Implementation...');
    
    try {
      const callbackPath = path.join(process.cwd(), 'app/api/aba-payway/callback/route.ts');
      const callbackContent = fs.readFileSync(callbackPath, 'utf8');
      
      // Check for proper FormData parsing
      if (!callbackContent.includes('req.formData()')) {
        this.issues.push('❌ Callback endpoint may not be parsing FormData correctly');
        this.recommendations.push('Ensure callback endpoint uses req.formData() to parse ABA PayWay POST data');
      } else {
        console.log('✅ FormData parsing implemented');
      }
      
      // Check for proper parameter extraction
      if (!callbackContent.includes('tran_id') || !callbackContent.includes('status') || !callbackContent.includes('apv')) {
        this.issues.push('❌ Missing required callback parameters (tran_id, status, apv)');
        this.recommendations.push('Ensure callback extracts tran_id, status, and apv parameters');
      } else {
        console.log('✅ Required parameters extracted');
      }
      
      // Check for signature verification
      if (!callbackContent.includes('verifyCallback')) {
        this.issues.push('❌ No signature verification found');
        this.recommendations.push('Implement signature verification for security');
      } else {
        console.log('✅ Signature verification implemented');
      }
      
      // Check for order lookup
      if (!callbackContent.includes('Order.findOne') || !callbackContent.includes('abaMerchantRefNo')) {
        this.issues.push('❌ Order lookup by merchant reference number not found');
        this.recommendations.push('Ensure order lookup uses abaMerchantRefNo field');
      } else {
        console.log('✅ Order lookup implemented');
      }
      
      // Check for updateOrderToPaid call
      if (!callbackContent.includes('updateOrderToPaid')) {
        this.issues.push('❌ updateOrderToPaid function not called');
        this.recommendations.push('Call updateOrderToPaid function for successful payments');
      } else {
        console.log('✅ updateOrderToPaid function called');
      }
      
    } catch (error) {
      this.issues.push(`❌ Error reading callback endpoint: ${error.message}`);
    }
  }

  checkSignatureVerification() {
    console.log('\n📋 Checking Signature Verification...');
    
    try {
      const abaPaywayPath = path.join(process.cwd(), 'lib/aba-payway.ts');
      const abaPaywayContent = fs.readFileSync(abaPaywayPath, 'utf8');
      
      // Check verifyCallback implementation
      if (!abaPaywayContent.includes('verifyCallback')) {
        this.issues.push('❌ verifyCallback method not found in ABA PayWay service');
        this.recommendations.push('Implement verifyCallback method in ABA PayWay service');
      } else {
        console.log('✅ verifyCallback method found');
        
        // Check if it handles callback parameters correctly
        if (!abaPaywayContent.includes('hash') || !abaPaywayContent.includes('generateHash')) {
          this.issues.push('❌ Signature verification may not be working correctly');
          this.recommendations.push('Ensure signature verification uses proper hash generation');
        } else {
          console.log('✅ Hash verification logic found');
        }
      }
      
    } catch (error) {
      this.issues.push(`❌ Error reading ABA PayWay service: ${error.message}`);
    }
  }

  checkOrderLookupLogic() {
    console.log('\n📋 Checking Order Lookup Logic...');
    
    try {
      const callbackPath = path.join(process.cwd(), 'app/api/aba-payway/callback/route.ts');
      const callbackContent = fs.readFileSync(callbackPath, 'utf8');
      
      // Check for proper order lookup
      if (callbackContent.includes('abaMerchantRefNo: tran_id')) {
        console.log('✅ Order lookup by merchant reference number');
      } else {
        this.issues.push('❌ Order lookup may not be using correct field mapping');
        this.recommendations.push('Ensure order lookup uses { abaMerchantRefNo: tran_id }');
      }
      
      // Check for fallback lookup
      if (callbackContent.includes('_id: tran_id')) {
        console.log('✅ Fallback order lookup by ID');
      } else {
        this.issues.push('⚠️ No fallback order lookup by ID');
        this.recommendations.push('Consider adding fallback lookup by order ID');
      }
      
      // Check for order not found handling
      if (callbackContent.includes('Order not found')) {
        console.log('✅ Order not found error handling');
      } else {
        this.issues.push('❌ Missing order not found error handling');
        this.recommendations.push('Add proper error handling for order not found');
      }
      
    } catch (error) {
      this.issues.push(`❌ Error checking order lookup logic: ${error.message}`);
    }
  }

  checkUpdateOrderToPaidFunction() {
    console.log('\n📋 Checking updateOrderToPaid Function...');
    
    try {
      const orderActionsPath = path.join(process.cwd(), 'lib/actions/order.actions.ts');
      const orderActionsContent = fs.readFileSync(orderActionsPath, 'utf8');
      
      // Check if function exists
      if (!orderActionsContent.includes('export async function updateOrderToPaid')) {
        this.issues.push('❌ updateOrderToPaid function not found');
        this.recommendations.push('Implement updateOrderToPaid function in order actions');
      } else {
        console.log('✅ updateOrderToPaid function found');
        
        // Check if it sets isPaid and paidAt
        if (orderActionsContent.includes('isPaid = true') && orderActionsContent.includes('paidAt = new Date()')) {
          console.log('✅ Function sets isPaid and paidAt fields');
        } else {
          this.issues.push('❌ updateOrderToPaid may not be setting isPaid/paidAt correctly');
          this.recommendations.push('Ensure updateOrderToPaid sets isPaid=true and paidAt=new Date()');
        }
        
        // Check for error handling
        if (orderActionsContent.includes('try') && orderActionsContent.includes('catch')) {
          console.log('✅ Error handling in updateOrderToPaid');
        } else {
          this.issues.push('❌ Missing error handling in updateOrderToPaid');
          this.recommendations.push('Add proper error handling to updateOrderToPaid function');
        }
        
        // Check for revalidation
        if (orderActionsContent.includes('revalidatePath')) {
          console.log('✅ Path revalidation for cache updates');
        } else {
          this.issues.push('⚠️ Missing path revalidation for frontend updates');
          this.recommendations.push('Add revalidatePath to update frontend cache');
        }
      }
      
    } catch (error) {
      this.issues.push(`❌ Error checking updateOrderToPaid function: ${error.message}`);
    }
  }

  checkCallbackParameterHandling() {
    console.log('\n📋 Checking Callback Parameter Handling...');
    
    try {
      const callbackPath = path.join(process.cwd(), 'app/api/aba-payway/callback/route.ts');
      const callbackContent = fs.readFileSync(callbackPath, 'utf8');
      
      // Check for proper status code parsing
      if (callbackContent.includes('parseInt(status')) {
        console.log('✅ Status code parsed as integer');
      } else {
        this.issues.push('❌ Status code may not be parsed correctly');
        this.recommendations.push('Parse status as integer: parseInt(status as string)');
      }
      
      // Check for amount parsing
      if (callbackContent.includes('parseFloat(approvedAmount')) {
        console.log('✅ Amount parsed as float');
      } else {
        this.issues.push('❌ Amount may not be parsed correctly');
        this.recommendations.push('Parse amount as float: parseFloat(approvedAmount as string)');
      }
      
      // Check for status code constants
      if (callbackContent.includes('ABA_PAYWAY_STATUS_CODES.SUCCESS')) {
        console.log('✅ Using status code constants');
      } else {
        this.issues.push('❌ Not using status code constants');
        this.recommendations.push('Use ABA_PAYWAY_STATUS_CODES.SUCCESS constant');
      }
      
    } catch (error) {
      this.issues.push(`❌ Error checking parameter handling: ${error.message}`);
    }
  }

  checkEnvironmentConfiguration() {
    console.log('\n📋 Checking Environment Configuration...');
    
    // Check for required environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SERVER_URL',
      'PAYWAY_MERCHANT_ID',
      'PAYWAY_SECRET_KEY'
    ];
    
    const envLocalPath = path.join(process.cwd(), '.env.local');
    const envExamplePath = path.join(process.cwd(), '.env.example');
    
    let envContent = '';
    if (fs.existsSync(envLocalPath)) {
      envContent = fs.readFileSync(envLocalPath, 'utf8');
      console.log('✅ .env.local file found');
    } else if (fs.existsSync(envExamplePath)) {
      envContent = fs.readFileSync(envExamplePath, 'utf8');
      console.log('⚠️ Only .env.example found, check .env.local');
    } else {
      this.issues.push('❌ No environment configuration files found');
      this.recommendations.push('Create .env.local with required ABA PayWay configuration');
      return;
    }
    
    requiredEnvVars.forEach(envVar => {
      if (envContent.includes(envVar)) {
        console.log(`✅ ${envVar} configured`);
      } else {
        this.issues.push(`❌ Missing environment variable: ${envVar}`);
        this.recommendations.push(`Add ${envVar} to environment configuration`);
      }
    });
    
    // Check callback URL configuration
    if (envContent.includes('NEXT_PUBLIC_SERVER_URL')) {
      if (envContent.includes('localhost') || envContent.includes('127.0.0.1')) {
        this.issues.push('⚠️ Using localhost URL - callbacks from ABA PayWay will not work');
        this.recommendations.push('Use ngrok or public URL for testing callbacks');
      } else {
        console.log('✅ Public URL configured for callbacks');
      }
    }
  }

  printResults() {
    console.log('\n📊 Diagnostic Results:');
    console.log('======================');
    
    if (this.issues.length === 0) {
      console.log('🎉 No issues found! The callback system appears to be configured correctly.');
    } else {
      console.log(`\n❌ Found ${this.issues.length} potential issues:\n`);
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
    
    if (this.recommendations.length > 0) {
      console.log('\n🔧 Recommendations:\n');
      this.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    console.log('\n🔍 Additional Debugging Steps:');
    console.log('1. Check server logs for callback requests from ABA PayWay');
    console.log('2. Verify callback URL is accessible from internet (use ngrok for local testing)');
    console.log('3. Test signature verification with known good callback data');
    console.log('4. Check database for abaMerchantRefNo field in orders');
    console.log('5. Verify ABA PayWay credentials are correct');
    console.log('6. Test with ABA PayWay sandbox environment first');
    
    console.log('\n💡 Common Issues:');
    console.log('- Callback URL not accessible from internet');
    console.log('- Signature verification failing due to incorrect hash generation');
    console.log('- Order lookup failing due to missing abaMerchantRefNo');
    console.log('- updateOrderToPaid function throwing errors');
    console.log('- Environment variables not set correctly');
  }
}

// Run diagnostics if called directly
if (require.main === module) {
  const diagnostic = new ABACallbackDiagnostic();
  diagnostic.runDiagnostics().catch(console.error);
}

module.exports = { ABACallbackDiagnostic };
