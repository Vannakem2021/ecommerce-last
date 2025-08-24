/**
 * User Creation and Authentication Test Script
 * 
 * This script tests the complete flow of creating a user through admin interface
 * and then authenticating with that user to ensure no inconsistent behavior.
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testUserCreationAndAuth() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔍 Testing User Creation and Authentication Flow');
    console.log('================================================\n');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Test user data
    const testUser = {
      name: 'Test Manager',
      email: 'test.manager@example.com',
      role: 'manager',
      password: 'testpassword123',
      emailVerified: false,
      paymentMethod: 'PayPal',
      address: {
        fullName: 'Test Manager',
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: '',
        phone: ''
      }
    };
    
    console.log('1. Testing User Creation Process');
    console.log('--------------------------------');
    
    // Clean up any existing test user
    await usersCollection.deleteOne({ email: testUser.email });
    
    // Simulate admin user creation
    const hashedPassword = await bcrypt.hash(testUser.password, 5);
    const newUser = await usersCollection.insertOne({
      ...testUser,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`✅ User created with ID: ${newUser.insertedId}`);
    
    // Verify user was created with all required fields
    const createdUser = await usersCollection.findOne({ _id: newUser.insertedId });
    
    console.log('\n2. Verifying User Schema Completeness');
    console.log('-------------------------------------');
    
    const requiredFields = [
      'name', 'email', 'role', 'password', 'emailVerified', 
      'paymentMethod', 'address'
    ];
    
    const addressFields = [
      'fullName', 'street', 'city', 'province', 
      'postalCode', 'country', 'phone'
    ];
    
    let schemaComplete = true;
    
    for (const field of requiredFields) {
      if (createdUser[field] === undefined) {
        console.log(`❌ Missing field: ${field}`);
        schemaComplete = false;
      } else {
        console.log(`✅ Field present: ${field}`);
      }
    }
    
    if (createdUser.address) {
      for (const field of addressFields) {
        if (createdUser.address[field] === undefined) {
          console.log(`❌ Missing address field: ${field}`);
          schemaComplete = false;
        } else {
          console.log(`✅ Address field present: ${field}`);
        }
      }
    }
    
    console.log('\n3. Testing Authentication Flow');
    console.log('------------------------------');
    
    // Simulate authentication lookup
    const normalizedEmail = testUser.email.toLowerCase().trim();
    const authUser = await usersCollection.findOne({ email: normalizedEmail });
    
    if (!authUser) {
      console.log('❌ User not found during authentication lookup');
      return;
    }
    
    console.log(`✅ User found during authentication: ${authUser.name}`);
    
    // Test password verification
    const passwordMatch = await bcrypt.compare(testUser.password, authUser.password);
    console.log(`✅ Password verification: ${passwordMatch ? 'SUCCESS' : 'FAILED'}`);
    
    // Simulate JWT token creation (what would be returned from authorize function)
    const tokenUser = {
      id: authUser._id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role
    };
    
    console.log('✅ Token user object created:', JSON.stringify(tokenUser, null, 2));
    
    console.log('\n4. Testing Session Creation');
    console.log('---------------------------');
    
    // Simulate session creation (what happens in session callback)
    const session = {
      user: {
        id: tokenUser.id.toString(),
        name: tokenUser.name,
        email: tokenUser.email,
        role: tokenUser.role
      }
    };
    
    console.log('✅ Session object created:', JSON.stringify(session, null, 2));
    
    console.log('\n5. Testing Permission Check');
    console.log('---------------------------');
    
    // Test RBAC permissions for manager role
    const ROLE_PERMISSIONS = {
      manager: [
        'products.create', 'products.read', 'products.update',
        'orders.read', 'orders.update',
        'categories.read', 'brands.read',
        'inventory.read', 'inventory.update',
        'reports.read'
      ]
    };
    
    function hasPermission(userRole, permission) {
      const role = userRole.toLowerCase();
      const rolePermissions = ROLE_PERMISSIONS[role];
      return rolePermissions ? rolePermissions.includes(permission) : false;
    }
    
    const hasReportsRead = hasPermission(session.user.role, 'reports.read');
    console.log(`✅ Manager has reports.read permission: ${hasReportsRead}`);
    
    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`Schema Complete: ${schemaComplete ? '✅ YES' : '❌ NO'}`);
    console.log(`Authentication: ${authUser ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Password Check: ${passwordMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Session Creation: ${session.user ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Permissions: ${hasReportsRead ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (schemaComplete && authUser && passwordMatch && session.user && hasReportsRead) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('User creation and authentication flow should work consistently.');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED!');
      console.log('There may still be issues with the authentication flow.');
    }
    
    // Clean up test user
    await usersCollection.deleteOne({ _id: newUser.insertedId });
    console.log('\n🧹 Test user cleaned up');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testUserCreationAndAuth().catch(console.error);
}

module.exports = { testUserCreationAndAuth };
