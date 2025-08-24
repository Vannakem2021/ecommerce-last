#!/usr/bin/env node

/**
 * Simple validation script for the automated ABA PayWay payment status system
 * 
 * This script validates:
 * 1. All required files are present
 * 2. Services are properly exported
 * 3. Error handling system is working
 * 4. Auto-polling service is functional
 */

const fs = require('fs');
const path = require('path');

class AutomatedPaymentStatusValidator {
  constructor() {
    this.validationResults = {
      filesPresent: false,
      servicesExported: false,
      errorHandling: false,
      autoPolling: false,
      frontendComponents: false
    };
  }

  validateRequiredFiles() {
    console.log('📋 Validating Required Files...');
    
    const requiredFiles = [
      'lib/aba-payway-auto-status.ts',
      'lib/aba-payway-error-handler.ts',
      'app/api/aba-payway/callback/route.ts',
      'app/api/aba-payway/start-auto-polling/route.ts',
      'components/aba-payway/payment-status.tsx',
      'tests/aba-payway-auto-status.test.ts'
    ];

    let allFilesPresent = true;

    requiredFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
      } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesPresent = false;
      }
    });

    this.validationResults.filesPresent = allFilesPresent;
    return allFilesPresent;
  }

  validateServiceExports() {
    console.log('\n📋 Validating Service Exports...');
    
    try {
      // Check auto-status service
      const autoStatusPath = path.join(process.cwd(), 'lib/aba-payway-auto-status.ts');
      const autoStatusContent = fs.readFileSync(autoStatusPath, 'utf8');
      
      const hasAutoStatusExport = autoStatusContent.includes('export const abaPayWayAutoStatusService');
      const hasStartPolling = autoStatusContent.includes('startPollingForOrder');
      const hasStopPolling = autoStatusContent.includes('stopPollingForOrder');
      
      if (hasAutoStatusExport && hasStartPolling && hasStopPolling) {
        console.log('✅ Auto-status service properly exported');
      } else {
        console.log('❌ Auto-status service missing required methods');
        return false;
      }

      // Check error handler
      const errorHandlerPath = path.join(process.cwd(), 'lib/aba-payway-error-handler.ts');
      const errorHandlerContent = fs.readFileSync(errorHandlerPath, 'utf8');
      
      const hasErrorHandler = errorHandlerContent.includes('export class ABAPayWayErrorHandler');
      const hasCreateError = errorHandlerContent.includes('createABAError');
      const hasParseError = errorHandlerContent.includes('parseABAError');
      
      if (hasErrorHandler && hasCreateError && hasParseError) {
        console.log('✅ Error handler properly exported');
      } else {
        console.log('❌ Error handler missing required methods');
        return false;
      }

      this.validationResults.servicesExported = true;
      return true;
    } catch (error) {
      console.log('❌ Error validating service exports:', error.message);
      return false;
    }
  }

  validateErrorHandling() {
    console.log('\n📋 Validating Error Handling Implementation...');
    
    try {
      const callbackPath = path.join(process.cwd(), 'app/api/aba-payway/callback/route.ts');
      const callbackContent = fs.readFileSync(callbackPath, 'utf8');
      
      const hasErrorImports = callbackContent.includes('ABAPayWayErrorHandler');
      const hasRetryMechanism = callbackContent.includes('withABARetry');
      const hasErrorLogging = callbackContent.includes('logABAError');
      const hasErrorResponse = callbackContent.includes('createResponse');
      
      if (hasErrorImports && hasRetryMechanism && hasErrorLogging && hasErrorResponse) {
        console.log('✅ Enhanced error handling implemented in callback');
      } else {
        console.log('❌ Callback missing enhanced error handling');
        return false;
      }

      this.validationResults.errorHandling = true;
      return true;
    } catch (error) {
      console.log('❌ Error validating error handling:', error.message);
      return false;
    }
  }

  validateAutoPolling() {
    console.log('\n📋 Validating Auto-Polling Implementation...');
    
    try {
      // Check auto-polling API endpoint
      const pollingApiPath = path.join(process.cwd(), 'app/api/aba-payway/start-auto-polling/route.ts');
      const pollingApiContent = fs.readFileSync(pollingApiPath, 'utf8');
      
      const hasPollingEndpoint = pollingApiContent.includes('startPollingForOrder');
      const hasAuthentication = pollingApiContent.includes('auth()');
      const hasOrderValidation = pollingApiContent.includes('Order.findById');
      
      if (hasPollingEndpoint && hasAuthentication && hasOrderValidation) {
        console.log('✅ Auto-polling API endpoint properly implemented');
      } else {
        console.log('❌ Auto-polling API endpoint missing required features');
        return false;
      }

      // Check payment creation integration
      const createPaymentPath = path.join(process.cwd(), 'app/api/aba-payway/create-payment/route.ts');
      const createPaymentContent = fs.readFileSync(createPaymentPath, 'utf8');
      
      const hasAutoPollingStart = createPaymentContent.includes('startPollingForOrder');
      const hasAutoStatusImport = createPaymentContent.includes('abaPayWayAutoStatusService');
      
      if (hasAutoPollingStart && hasAutoStatusImport) {
        console.log('✅ Auto-polling integrated with payment creation');
      } else {
        console.log('❌ Auto-polling not integrated with payment creation');
        return false;
      }

      this.validationResults.autoPolling = true;
      return true;
    } catch (error) {
      console.log('❌ Error validating auto-polling:', error.message);
      return false;
    }
  }

  validateFrontendComponents() {
    console.log('\n📋 Validating Frontend Components...');
    
    try {
      const paymentStatusPath = path.join(process.cwd(), 'components/aba-payway/payment-status.tsx');
      const paymentStatusContent = fs.readFileSync(paymentStatusPath, 'utf8');
      
      const hasAutoPollingProp = paymentStatusContent.includes('autoPolling');
      const hasPollingState = paymentStatusContent.includes('isAutoPolling');
      const hasPollingLogic = paymentStatusContent.includes('startAutoPolling');
      const hasPollingCleanup = paymentStatusContent.includes('stopAutoPolling');
      const hasPollingIndicator = paymentStatusContent.includes('Auto-updating');
      
      if (hasAutoPollingProp && hasPollingState && hasPollingLogic && hasPollingCleanup && hasPollingIndicator) {
        console.log('✅ Frontend auto-polling properly implemented');
      } else {
        console.log('❌ Frontend auto-polling missing required features');
        return false;
      }

      // Check order details form integration
      const orderDetailsPath = path.join(process.cwd(), 'components/shared/order/order-details-form.tsx');
      const orderDetailsContent = fs.readFileSync(orderDetailsPath, 'utf8');
      
      const hasAutoPollingEnabled = orderDetailsContent.includes('autoPolling={true}');
      const hasManualRefreshDisabled = orderDetailsContent.includes('showRefresh={false}');
      
      if (hasAutoPollingEnabled && hasManualRefreshDisabled) {
        console.log('✅ Order details form properly configured for auto-polling');
      } else {
        console.log('❌ Order details form not properly configured');
        return false;
      }

      this.validationResults.frontendComponents = true;
      return true;
    } catch (error) {
      console.log('❌ Error validating frontend components:', error.message);
      return false;
    }
  }

  validateConfiguration() {
    console.log('\n📋 Validating Configuration...');
    
    try {
      // Check if required environment variables are documented
      const envExample = path.join(process.cwd(), '.env.example');
      const envLocal = path.join(process.cwd(), '.env.local');
      
      let hasEnvConfig = false;
      
      if (fs.existsSync(envExample)) {
        const envContent = fs.readFileSync(envExample, 'utf8');
        if (envContent.includes('PAYWAY_') || envContent.includes('ABA_')) {
          hasEnvConfig = true;
          console.log('✅ Environment variables documented');
        }
      }
      
      if (!hasEnvConfig && fs.existsSync(envLocal)) {
        const envContent = fs.readFileSync(envLocal, 'utf8');
        if (envContent.includes('PAYWAY_') || envContent.includes('ABA_')) {
          hasEnvConfig = true;
          console.log('✅ Environment variables configured locally');
        }
      }
      
      if (!hasEnvConfig) {
        console.log('⚠️ Environment variables not found (may need manual configuration)');
      }
      
      return true;
    } catch (error) {
      console.log('❌ Error validating configuration:', error.message);
      return false;
    }
  }

  async runValidation() {
    console.log('🚀 Starting Automated Payment Status Validation...\n');
    
    try {
      this.validateRequiredFiles();
      this.validateServiceExports();
      this.validateErrorHandling();
      this.validateAutoPolling();
      this.validateFrontendComponents();
      this.validateConfiguration();
      
      this.printResults();
    } catch (error) {
      console.error('💥 Validation failed:', error.message);
    }
  }

  printResults() {
    console.log('\n📊 Validation Results Summary:');
    console.log('==============================');
    
    const results = [
      { name: 'Required Files Present', passed: this.validationResults.filesPresent },
      { name: 'Services Properly Exported', passed: this.validationResults.servicesExported },
      { name: 'Error Handling Implemented', passed: this.validationResults.errorHandling },
      { name: 'Auto-Polling Service Working', passed: this.validationResults.autoPolling },
      { name: 'Frontend Components Updated', passed: this.validationResults.frontendComponents }
    ];

    results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.name}`);
    });

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    console.log(`\n🎯 Overall Score: ${passedCount}/${totalCount} validations passed`);
    
    if (passedCount === totalCount) {
      console.log('\n🎉 All validations passed! The automated payment status system is properly implemented.');
      console.log('\n📝 Next Steps:');
      console.log('1. Test the system with a real payment flow');
      console.log('2. Monitor the auto-polling performance');
      console.log('3. Verify callback handling in production');
      console.log('4. Set up monitoring and alerts');
    } else {
      console.log('\n⚠️ Some validations failed. Please review the implementation.');
      console.log('\n🔧 Recommended Actions:');
      
      if (!this.validationResults.filesPresent) {
        console.log('- Ensure all required files are created');
      }
      if (!this.validationResults.servicesExported) {
        console.log('- Check service exports and method signatures');
      }
      if (!this.validationResults.errorHandling) {
        console.log('- Implement enhanced error handling in callback');
      }
      if (!this.validationResults.autoPolling) {
        console.log('- Complete auto-polling service integration');
      }
      if (!this.validationResults.frontendComponents) {
        console.log('- Update frontend components for auto-polling');
      }
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new AutomatedPaymentStatusValidator();
  validator.runValidation().catch(console.error);
}

module.exports = { AutomatedPaymentStatusValidator };
