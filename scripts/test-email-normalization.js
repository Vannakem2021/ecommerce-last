/**
 * Email Normalization Test Script
 * 
 * This script tests the email normalization functionality to ensure
 * case sensitivity issues are resolved.
 */

// Simulate the email validation schema transform
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return email;
  return email.toLowerCase().trim();
}

// Test cases for email normalization
function testEmailNormalization() {
  console.log('🔍 Email Normalization Test Results:');
  console.log('====================================');
  
  const testCases = [
    'Vannakem312@gmail.com',
    'vannakem312@gmail.com',
    'VANNAKEM312@GMAIL.COM',
    'VannaKem312@Gmail.Com',
    '  Vannakem312@gmail.com  ', // with spaces
    'Admin@Example.com',
    'admin@example.com',
    'ADMIN@EXAMPLE.COM',
    'Test.User@Domain.Co.UK',
    'test.user@domain.co.uk',
    '', // empty string
    null, // null value
    undefined, // undefined value
    '   ', // only spaces
  ];
  
  testCases.forEach((email, index) => {
    const normalized = normalizeEmail(email);
    const status = email === normalized ? '✅ No change' : '🔄 Normalized';
    console.log(`${index + 1}. Input: "${email}" -> Output: "${normalized}" ${status}`);
  });
  
  console.log('\n📋 Expected Behavior:');
  console.log('- All emails should be converted to lowercase');
  console.log('- Leading/trailing spaces should be removed');
  console.log('- null/undefined should remain unchanged');
  console.log('- Empty strings should remain unchanged');
  
  // Test duplicate detection
  console.log('\n🔍 Duplicate Detection Test:');
  const emails = [
    'Vannakem312@gmail.com',
    'vannakem312@gmail.com',
    'VANNAKEM312@GMAIL.COM',
    'admin@example.com',
    'Admin@Example.com'
  ];
  
  const normalizedEmails = emails.map(normalizeEmail);
  const uniqueEmails = [...new Set(normalizedEmails)];
  
  console.log('Original emails:', emails);
  console.log('Normalized emails:', normalizedEmails);
  console.log('Unique normalized emails:', uniqueEmails);
  console.log(`Duplicates removed: ${emails.length - uniqueEmails.length}`);
}

// Test authentication flow simulation
function testAuthFlow() {
  console.log('\n🔐 Authentication Flow Test:');
  console.log('=============================');
  
  // Simulate user database
  const users = [
    { id: 1, email: 'admin@example.com', name: 'Admin User' },
    { id: 2, email: 'vannakem312@gmail.com', name: 'Vanna Kem' },
    { id: 3, email: 'test@domain.com', name: 'Test User' }
  ];
  
  // Simulate login attempts with different cases
  const loginAttempts = [
    'Admin@Example.com',
    'admin@example.com',
    'ADMIN@EXAMPLE.COM',
    'Vannakem312@gmail.com',
    'vannakem312@gmail.com',
    'VANNAKEM312@GMAIL.COM',
    'nonexistent@email.com'
  ];
  
  loginAttempts.forEach(loginEmail => {
    const normalizedLoginEmail = normalizeEmail(loginEmail);
    const foundUser = users.find(user => user.email === normalizedLoginEmail);
    
    if (foundUser) {
      console.log(`✅ Login success: "${loginEmail}" -> Found user: ${foundUser.name}`);
    } else {
      console.log(`❌ Login failed: "${loginEmail}" -> No user found`);
    }
  });
}

// Run all tests
function runAllTests() {
  testEmailNormalization();
  testAuthFlow();
  
  console.log('\n🎯 Summary:');
  console.log('- Email normalization should resolve case sensitivity issues');
  console.log('- All variations of the same email should find the same user');
  console.log('- Database should store emails in lowercase format');
  console.log('- Authentication should work regardless of input case');
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    normalizeEmail, 
    testEmailNormalization, 
    testAuthFlow, 
    runAllTests 
  };
}

// For browser testing
if (typeof window !== 'undefined') {
  window.emailTest = { 
    normalizeEmail, 
    testEmailNormalization, 
    testAuthFlow, 
    runAllTests 
  };
}

// Auto-run if script is executed directly
if (require.main === module) {
  runAllTests();
}
