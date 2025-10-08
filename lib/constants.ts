import { getSecureEnvVar, validateEmailServiceConfig, isProduction, isDevelopment } from '@/lib/utils/environment'

// Validate email service configuration
const emailConfig = validateEmailServiceConfig()
if (emailConfig.warning) {
  console.warn(`⚠️  [Email Service] ${emailConfig.warning}`)
}

export const SENDER_NAME = getSecureEnvVar('SENDER_NAME', false, 'BCS Support')
export const SENDER_EMAIL = getSecureEnvVar('SENDER_EMAIL', false, 'onboarding@resend.dev')

// Additional validation for production
if (isProduction()) {
  if (SENDER_EMAIL.includes('resend.dev') || SENDER_EMAIL.includes('example.com')) {
    console.warn('⚠️  WARNING: Using default/example email address in production')
  }
}

// Email service status logging
if (isDevelopment()) {
  const hasApiKey = !!getSecureEnvVar('RESEND_API_KEY', false)
  const hasCustomSender = SENDER_EMAIL !== 'onboarding@resend.dev'
  const hasCustomName = SENDER_NAME !== 'BCS Support'

  if (hasApiKey && (!hasCustomSender || !hasCustomName)) {
    console.info('ℹ️  Email service partially configured:')
    if (!hasCustomSender) console.info('   • Consider setting SENDER_EMAIL for branded emails')
    if (!hasCustomName) console.info('   • Consider setting SENDER_NAME for branded emails')
  }
}

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
    'users.create', 'users.read', 'users.update', 'users.delete', 'users.export',
    // Product management
    'products.create', 'products.read', 'products.update', 'products.delete', 'products.export',
    // Order management
    'orders.create', 'orders.read', 'orders.update', 'orders.delete', 'orders.export',
    // Category management
    'categories.create', 'categories.read', 'categories.update', 'categories.delete',
    // Brand management
    'brands.create', 'brands.read', 'brands.update', 'brands.delete',
    // Inventory management
    'inventory.read', 'inventory.update', 'inventory.export',
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
    'orders.create', 'orders.read', 'orders.update',
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
    'orders.create', 'orders.read', 'orders.update',
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
  'best-seller',
  'new-arrival',
] as const
