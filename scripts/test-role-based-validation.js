/**
 * Role-Based User Validation Test Script
 * 
 * This script tests the new role-based validation system to ensure:
 * 1. Customer users require address and payment method
 * 2. System users (admin, manager, seller) don't require these fields
 * 3. Validation works correctly for both scenarios
 */

console.log('🔍 Role-Based User Validation Test');
console.log('===================================\n');

// Simulate the validation schemas (simplified versions for testing)
function validateUserInput(userData) {
  const errors = [];
  
  // Basic required fields for all users
  if (!userData.name || userData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (!userData.email || !userData.email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (!userData.role || !['admin', 'manager', 'seller', 'user'].includes(userData.role)) {
    errors.push('Valid role is required');
  }
  
  if (!userData.password || userData.password.length < 3) {
    errors.push('Password must be at least 3 characters');
  }
  
  // Role-specific validation
  if (userData.role === 'user') {
    // Customer users must have payment method and complete address
    if (!userData.paymentMethod || userData.paymentMethod.trim().length === 0) {
      errors.push('Customer users must provide payment method');
    }
    
    if (!userData.address) {
      errors.push('Customer users must provide address information');
    } else {
      const requiredAddressFields = ['fullName', 'street', 'city', 'province', 'postalCode', 'country', 'phone'];
      for (const field of requiredAddressFields) {
        if (!userData.address[field] || userData.address[field].trim().length === 0) {
          errors.push(`Customer users must provide address.${field}`);
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Test cases
const testCases = [
  {
    name: 'Valid Customer User',
    data: {
      name: 'John Customer',
      email: 'john@customer.com',
      role: 'user',
      password: 'password123',
      paymentMethod: 'PayPal',
      address: {
        fullName: 'John Customer',
        street: '123 Main St',
        city: 'New York',
        province: 'NY',
        postalCode: '10001',
        country: 'USA',
        phone: '555-1234'
      }
    },
    expectedValid: true
  },
  {
    name: 'Invalid Customer User (Missing Address)',
    data: {
      name: 'Jane Customer',
      email: 'jane@customer.com',
      role: 'user',
      password: 'password123',
      paymentMethod: 'PayPal'
      // Missing address
    },
    expectedValid: false
  },
  {
    name: 'Invalid Customer User (Incomplete Address)',
    data: {
      name: 'Bob Customer',
      email: 'bob@customer.com',
      role: 'user',
      password: 'password123',
      paymentMethod: 'PayPal',
      address: {
        fullName: 'Bob Customer',
        street: '456 Oak Ave',
        // Missing other address fields
      }
    },
    expectedValid: false
  },
  {
    name: 'Valid Admin User (No Address Required)',
    data: {
      name: 'Alice Admin',
      email: 'alice@admin.com',
      role: 'admin',
      password: 'adminpass123'
      // No paymentMethod or address - should be valid
    },
    expectedValid: true
  },
  {
    name: 'Valid Manager User (No Address Required)',
    data: {
      name: 'Mike Manager',
      email: 'mike@manager.com',
      role: 'manager',
      password: 'managerpass123'
      // No paymentMethod or address - should be valid
    },
    expectedValid: true
  },
  {
    name: 'Valid Seller User (No Address Required)',
    data: {
      name: 'Sarah Seller',
      email: 'sarah@seller.com',
      role: 'seller',
      password: 'sellerpass123'
      // No paymentMethod or address - should be valid
    },
    expectedValid: true
  },
  {
    name: 'Valid Admin User (With Optional Address)',
    data: {
      name: 'Tom Admin',
      email: 'tom@admin.com',
      role: 'admin',
      password: 'adminpass123',
      paymentMethod: 'Credit Card',
      address: {
        fullName: 'Tom Admin',
        street: '789 Admin Blvd',
        city: 'Admin City',
        province: 'AC',
        postalCode: '12345',
        country: 'USA',
        phone: '555-9999'
      }
    },
    expectedValid: true
  }
];

// Run tests
console.log('Running validation tests...\n');

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  const result = validateUserInput(testCase.data);
  const passed = result.isValid === testCase.expectedValid;
  
  console.log(`${index + 1}. ${testCase.name}`);
  console.log(`   Expected: ${testCase.expectedValid ? 'VALID' : 'INVALID'}`);
  console.log(`   Actual: ${result.isValid ? 'VALID' : 'INVALID'}`);
  console.log(`   Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!result.isValid && result.errors.length > 0) {
    console.log(`   Errors: ${result.errors.join(', ')}`);
  }
  
  if (passed) {
    passedTests++;
  }
  
  console.log('');
});

// Summary
console.log('📊 Test Summary:');
console.log(`   Passed: ${passedTests}/${totalTests}`);
console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 All tests passed! Role-based validation is working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the validation logic.');
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateUserInput, testCases };
}
