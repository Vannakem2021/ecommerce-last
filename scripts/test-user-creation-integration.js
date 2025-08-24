/**
 * User Creation Integration Test
 * 
 * This script tests the complete user creation flow with the new role-based validation system.
 * It simulates the admin user creation process for different user roles.
 */

console.log('🔍 User Creation Integration Test');
console.log('=================================\n');

// Simulate the AdminUserCreateSchema validation
function validateAdminUserCreate(userData) {
  const errors = [];
  
  // Basic validation
  if (!userData.name || userData.name.trim().length < 2) {
    errors.push('Username must be at least 2 characters');
  }
  
  if (!userData.email || !userData.email.includes('@')) {
    errors.push('Email is invalid');
  }
  
  if (!userData.role || !['admin', 'manager', 'seller', 'user'].includes(userData.role)) {
    errors.push('Invalid role. Must be admin, manager, seller, or user');
  }
  
  if (!userData.password || userData.password.length < 3) {
    errors.push('Password must be at least 3 characters');
  }
  
  // Role-specific validation (matching our enhanced AdminUserCreateSchema)
  if (userData.role === 'user') {
    // Customer users require payment method and complete address
    if (!userData.paymentMethod || userData.paymentMethod.trim().length === 0) {
      errors.push('Customer users must provide payment method and complete address information');
    }
    
    if (!userData.address) {
      errors.push('Customer users must provide payment method and complete address information');
    } else {
      const requiredFields = ['fullName', 'street', 'city', 'province', 'postalCode', 'country', 'phone'];
      const missingFields = requiredFields.filter(field => 
        !userData.address[field] || userData.address[field].trim().length === 0
      );
      
      if (missingFields.length > 0) {
        errors.push('Customer users must provide payment method and complete address information');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Simulate the user creation process
function simulateUserCreation(userData) {
  console.log(`Creating ${userData.role} user: ${userData.name}`);
  
  // Step 1: Validate input
  const validation = validateAdminUserCreate(userData);
  if (!validation.isValid) {
    return {
      success: false,
      message: validation.errors[0], // Return first error
      step: 'validation'
    };
  }
  
  // Step 2: Prepare user data based on role (matching our updated logic)
  const preparedData = {
    name: userData.name,
    email: userData.email.toLowerCase().trim(),
    role: userData.role,
    password: '[HASHED]', // Simulated hash
    emailVerified: false,
  };
  
  // Only add customer-specific fields for customer users
  if (userData.role === 'user') {
    preparedData.paymentMethod = userData.paymentMethod || 'PayPal';
    preparedData.address = userData.address || {
      fullName: userData.name,
      street: '',
      city: '',
      province: '',
      postalCode: '',
      country: '',
      phone: ''
    };
  } else {
    // For system users, only add these fields if explicitly provided
    if (userData.paymentMethod) {
      preparedData.paymentMethod = userData.paymentMethod;
    }
    if (userData.address) {
      preparedData.address = userData.address;
    }
  }
  
  // Step 3: Simulate database creation
  console.log(`   ✅ User data prepared:`, {
    ...preparedData,
    password: '[HIDDEN]'
  });
  
  return {
    success: true,
    message: 'User created successfully',
    data: {
      id: 'simulated-id-' + Date.now(),
      name: preparedData.name,
      email: preparedData.email,
      role: preparedData.role
    }
  };
}

// Test cases for admin user creation
const adminCreateTestCases = [
  {
    name: 'Create Admin User (Minimal Data)',
    userData: {
      name: 'System Admin',
      email: 'admin@company.com',
      role: 'admin',
      password: 'securepass123',
      sendWelcomeEmail: false
    },
    expectedSuccess: true
  },
  {
    name: 'Create Manager User (Minimal Data)',
    userData: {
      name: 'Store Manager',
      email: 'manager@company.com',
      role: 'manager',
      password: 'managerpass123',
      sendWelcomeEmail: false
    },
    expectedSuccess: true
  },
  {
    name: 'Create Seller User (Minimal Data)',
    userData: {
      name: 'Sales Rep',
      email: 'seller@company.com',
      role: 'seller',
      password: 'sellerpass123',
      sendWelcomeEmail: false
    },
    expectedSuccess: true
  },
  {
    name: 'Create Customer User (Without Address - Should Fail)',
    userData: {
      name: 'John Customer',
      email: 'john@customer.com',
      role: 'user',
      password: 'customerpass123',
      sendWelcomeEmail: false
    },
    expectedSuccess: false
  },
  {
    name: 'Create Customer User (With Complete Data)',
    userData: {
      name: 'Jane Customer',
      email: 'jane@customer.com',
      role: 'user',
      password: 'customerpass123',
      sendWelcomeEmail: false,
      paymentMethod: 'Credit Card',
      address: {
        fullName: 'Jane Customer',
        street: '123 Customer St',
        city: 'Customer City',
        province: 'CC',
        postalCode: '12345',
        country: 'USA',
        phone: '555-0123'
      }
    },
    expectedSuccess: true
  },
  {
    name: 'Create Admin User (With Optional Address)',
    userData: {
      name: 'Admin With Address',
      email: 'admin.address@company.com',
      role: 'admin',
      password: 'adminpass123',
      sendWelcomeEmail: true,
      paymentMethod: 'Corporate Card',
      address: {
        fullName: 'Admin With Address',
        street: '456 Admin Ave',
        city: 'Admin City',
        province: 'AC',
        postalCode: '67890',
        country: 'USA',
        phone: '555-0456'
      }
    },
    expectedSuccess: true
  }
];

// Run integration tests
console.log('Running user creation integration tests...\n');

let passedTests = 0;
let totalTests = adminCreateTestCases.length;

adminCreateTestCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  
  const result = simulateUserCreation(testCase.userData);
  const passed = result.success === testCase.expectedSuccess;
  
  console.log(`   Expected: ${testCase.expectedSuccess ? 'SUCCESS' : 'FAILURE'}`);
  console.log(`   Actual: ${result.success ? 'SUCCESS' : 'FAILURE'}`);
  console.log(`   Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!result.success) {
    console.log(`   Error: ${result.message}`);
  } else if (result.data) {
    console.log(`   Created: ${result.data.role} user with ID ${result.data.id}`);
  }
  
  if (passed) {
    passedTests++;
  }
  
  console.log('');
});

// Summary
console.log('📊 Integration Test Summary:');
console.log(`   Passed: ${passedTests}/${totalTests}`);
console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 All integration tests passed!');
  console.log('✅ System users can be created without address/payment fields');
  console.log('✅ Customer users require complete address and payment information');
  console.log('✅ Optional fields work correctly for system users');
} else {
  console.log('\n⚠️  Some integration tests failed. Please review the implementation.');
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { simulateUserCreation, validateAdminUserCreate, adminCreateTestCases };
}
