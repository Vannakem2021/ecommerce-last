/**
 * RBAC Permission Test Script
 * 
 * This script tests the RBAC permission system to debug authorization issues.
 * Run this in Node.js environment or adapt for browser testing.
 */

// Copy the constants from lib/constants.ts for testing
const ROLE_PERMISSIONS = {
  admin: [
    'users.create', 'users.read', 'users.update', 'users.delete',
    'products.create', 'products.read', 'products.update', 'products.delete',
    'orders.read', 'orders.update', 'orders.delete',
    'categories.create', 'categories.read', 'categories.update', 'categories.delete',
    'brands.create', 'brands.read', 'brands.update', 'brands.delete',
    'inventory.read', 'inventory.update',
    'settings.read', 'settings.update',
    'pages.create', 'pages.read', 'pages.update', 'pages.delete',
    'reports.read'
  ],
  manager: [
    'products.create', 'products.read', 'products.update',
    'orders.read', 'orders.update',
    'categories.read', 'brands.read',
    'inventory.read', 'inventory.update',
    'reports.read'
  ],
  seller: [
    'products.read', 'products.update',
    'orders.read', 'orders.update',
    'inventory.read',
    'reports.read'
  ],
  user: [
    'orders.read'
  ]
};

// Copy the hasPermission function from lib/rbac-utils.ts
function hasPermission(userRole, permission) {
  if (!userRole || !permission) return false;
  
  const role = userRole.toLowerCase();
  const rolePermissions = ROLE_PERMISSIONS[role];
  
  if (!rolePermissions) return false;
  
  return rolePermissions.includes(permission);
}

// Test function
function testPermissions() {
  console.log('🔍 RBAC Permission Test Results:');
  console.log('================================');
  
  const testCases = [
    { role: 'admin', permission: 'reports.read' },
    { role: 'manager', permission: 'reports.read' },
    { role: 'seller', permission: 'reports.read' },
    { role: 'user', permission: 'reports.read' },
    { role: 'Seller', permission: 'reports.read' }, // Test case sensitivity
    { role: 'SELLER', permission: 'reports.read' }, // Test case sensitivity
    { role: null, permission: 'reports.read' },
    { role: 'seller', permission: null },
    { role: 'nonexistent', permission: 'reports.read' }
  ];
  
  testCases.forEach(({ role, permission }) => {
    const result = hasPermission(role, permission);
    const status = result ? '✅' : '❌';
    console.log(`${status} Role: "${role}" | Permission: "${permission}" | Result: ${result}`);
  });
  
  console.log('\n📋 Expected Results:');
  console.log('- admin, manager, seller should have reports.read: ✅');
  console.log('- user should NOT have reports.read: ❌');
  console.log('- Case variations (Seller, SELLER) should work: ✅');
  console.log('- null/undefined values should return false: ❌');
}

// Run the test
testPermissions();

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { hasPermission, testPermissions, ROLE_PERMISSIONS };
}

// For browser testing
if (typeof window !== 'undefined') {
  window.rbacTest = { hasPermission, testPermissions, ROLE_PERMISSIONS };
}
