export const SENDER_NAME = process.env.SENDER_NAME || 'BCS Support'
export const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev'

// RBAC Role System
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SELLER: 'seller',
  USER: 'user'
} as const

// Legacy array format for backward compatibility
export const USER_ROLES_ARRAY = ['admin', 'manager', 'seller', 'user'] as const

// Role hierarchy for permission checking (higher number = more privileges)
export const ROLE_HIERARCHY = {
  admin: 4,    // Highest privileges - can manage everything
  manager: 3,  // Middle management - can manage products, orders, inventory
  seller: 2,   // Sales-focused - can view/update products and orders
  user: 1      // Basic user - can only access own account
} as const

// Permission definitions for each role
export const ROLE_PERMISSIONS = {
  admin: [
    // User management
    'users.create', 'users.read', 'users.update', 'users.delete',
    // Product management
    'products.create', 'products.read', 'products.update', 'products.delete',
    // Order management
    'orders.read', 'orders.update', 'orders.delete',
    // Category management
    'categories.create', 'categories.read', 'categories.update', 'categories.delete',
    // Brand management
    'brands.create', 'brands.read', 'brands.update', 'brands.delete',
    // Inventory management
    'inventory.read', 'inventory.update',
    // Settings management
    'settings.read', 'settings.update',
    // Page management
    'pages.create', 'pages.read', 'pages.update', 'pages.delete',
    // Promotion management
    'promotions.create', 'promotions.read', 'promotions.update', 'promotions.delete',
    // Reports access
    'reports.read'
  ],
  manager: [
    // Product management (no delete)
    'products.create', 'products.read', 'products.update',
    // Order management (no delete)
    'orders.read', 'orders.update',
    // Read-only access to categories and brands
    'categories.read', 'brands.read',
    // Inventory management
    'inventory.read', 'inventory.update',
    // Promotion management (read and update only)
    'promotions.read', 'promotions.update',
    // Reports access
    'reports.read'
  ],
  seller: [
    // Product management (read and update only)
    'products.read', 'products.update',
    // Order management (read and update only)
    'orders.read', 'orders.update',
    // Inventory read access
    'inventory.read',
    // Promotion read access
    'promotions.read',
    // Reports access
    'reports.read'
  ],
  user: [
    // Can only read own orders
    'orders.read'
  ]
} as const

// Type definitions for TypeScript
export type UserRole = keyof typeof ROLE_HIERARCHY
export type Permission =
  | typeof ROLE_PERMISSIONS.admin[number]
  | typeof ROLE_PERMISSIONS.manager[number]
  | typeof ROLE_PERMISSIONS.seller[number]
  | typeof ROLE_PERMISSIONS.user[number]

export const COLORS = ['Green']
export const THEMES = ['Light', 'Dark', 'System']

// Predefined product tags - matching home page sections
// Note: Time-based sales are now handled via saleStartDate/saleEndDate fields
export const PRODUCT_TAGS = [
  'featured',
  'best-seller',
  'new-arrival',
] as const
