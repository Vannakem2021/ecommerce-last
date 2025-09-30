/**
 * Test User Fixtures
 *
 * Defines test users for different roles and scenarios.
 * These users should match the seeded data in the test database.
 */

export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'seller' | 'user';
  id?: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  // Admin user - full access
  // Matches seeded user: admin@gmail.com (John)
  admin: {
    email: 'admin@gmail.com',
    password: 'Admin2024!SecureP@ss#Dev',
    name: 'John',
    role: 'admin',
  },

  // Manager user - can manage products, orders, inventory
  // Matches seeded user: jane@gmail.com (Jane)
  manager: {
    email: 'jane@gmail.com',
    password: 'Manager2024#SecureP@ss$Dev',
    name: 'Jane',
    role: 'manager',
  },

  // Seller user - can view and update products/orders
  // Matches seeded user: jack@gmail.com (Jack)
  seller: {
    email: 'jack@gmail.com',
    password: 'Seller2024$SecureP@ss!Dev',
    name: 'Jack',
    role: 'seller',
  },

  // Regular user - basic access
  // Matches seeded user: sarah@gmail.com (Sarah)
  user: {
    email: 'sarah@gmail.com',
    password: 'User2024SimplePassDev123',
    name: 'Sarah',
    role: 'user',
  },

  // Secondary user for cross-user testing
  // Matches seeded user: michael@gmail.com (Michael)
  user2: {
    email: 'michael@gmail.com',
    password: 'User2024SimplePassDev123',
    name: 'Michael',
    role: 'user',
  },
}

export const INVALID_CREDENTIALS = {
  email: 'nonexistent@test.com',
  password: 'WrongPassword123!',
}

export const MALICIOUS_INPUTS = {
  sqlInjection: "' OR '1'='1",
  nosqlInjection: { $ne: null },
  xss: '<script>alert("XSS")</script>',
  commandInjection: '; rm -rf /',
};