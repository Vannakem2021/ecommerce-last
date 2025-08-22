# Role-Based Access Control (RBAC) Implementation Plan

## Current System Analysis

### Authentication & Authorization Overview
The e-commerce project currently uses NextAuth.js with the following setup:

**Current Authentication Stack:**
- NextAuth.js with JWT strategy (30-day sessions)
- MongoDB adapter for user storage
- Google OAuth and Credentials providers
- Session management with role information

**Current Role Structure:**
- Only 2 roles: `Admin` and `User` (defined in `lib/constants.ts`)
- Default role: `User` (set in user model schema)
- Role stored in JWT token and session

**Current Authorization Patterns:**
- Page-level checks: `session?.user.role !== 'Admin'` throws error
- Middleware: Basic authentication check for protected paths (`/admin/*`, `/account/*`, `/checkout/*`)
- No granular permission system
- No role-based server action protection

### Database Schema
**User Model (`lib/db/models/user.model.ts`):**
```typescript
{
  email: String (required, unique)
  name: String (required)
  role: String (required, default: 'User')
  password: String (optional - for OAuth users)
  image: String (optional)
  emailVerified: Boolean (default: false)
  timestamps: true
}
```

### Current Admin Access Control
**Protected Admin Pages:**
- `/admin/overview` - Dashboard with sales reports
- `/admin/orders` - Order management
- `/admin/products` - Product CRUD
- `/admin/categories` - Category CRUD  
- `/admin/brands` - Brand CRUD
- `/admin/users` - User management (edit only, no create)
- `/admin/inventory` - Stock management
- `/admin/web-pages` - CMS pages
- `/admin/settings` - Site configuration

**Current Protection Method:**
```typescript
const session = await auth()
if (session?.user.role !== 'Admin')
  throw new Error('Admin permission required')
```

### Server Actions Analysis
**Unprotected Admin Actions (Security Gap):**
- `createProduct`, `updateProduct`, `deleteProduct`
- `createCategory`, `updateCategory`, `deleteCategory`
- `createBrand`, `updateBrand`, `deleteBrand`
- `createWebPage`, `updateWebPage`, `deleteWebPage`
- `updateUser`, `deleteUser`
- `updateSetting`

**Partially Protected Actions:**
- `setProductStock`, `adjustProductStock` - Only check authentication, not role

### Missing Features
1. **User Creation by Admin** - No admin interface to create users
2. **Role Assignment Restrictions** - No hierarchy-based role assignment
3. **Granular Permissions** - No feature-level access control
4. **Server Action Protection** - Most admin actions lack role verification

## RBAC Requirements Implementation

### 1. Role Structure Expansion

**New Role Hierarchy (4 roles):**
```typescript
// lib/constants.ts
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  SELLER: 'seller',
  USER: 'user'
} as const

export const ROLE_HIERARCHY = {
  admin: 4,    // Highest privileges
  manager: 3,  // Middle management
  seller: 2,   // Sales-focused
  user: 1      // Basic user
} as const

export const ROLE_PERMISSIONS = {
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
    'orders.read' // Own orders only
  ]
} as const
```

### 2. Database Schema Updates

**No database migration needed** - Current `role` field as String can accommodate new role values.

**Data Migration Script:**
```typescript
// Update existing users from 'Admin'/'User' to new lowercase format
// 'Admin' -> 'admin', 'User' -> 'user'
```

### 3. Validation Schema Updates

**Update `lib/validator.ts`:**
```typescript
const UserRole = z.enum(['admin', 'manager', 'seller', 'user'])

// Add new schema for admin user creation
export const AdminUserCreateSchema = z.object({
  name: UserName,
  email: Email,
  role: UserRole,
  password: Password,
  sendWelcomeEmail: z.boolean().default(false)
})
```

## Impact Assessment

### Files Requiring Modification

**Core Authentication & Authorization:**
1. `lib/constants.ts` - Role definitions and permissions
2. `lib/validator.ts` - Role validation schema
3. `auth.ts` - Update default role assignment
4. `middleware.ts` - Enhanced role-based routing (optional)

**Server Actions (Add Role Protection):**
5. `lib/actions/user.actions.ts` - Add createUserByAdmin, role checks
6. `lib/actions/product.actions.ts` - Add permission checks
7. `lib/actions/category.actions.ts` - Add permission checks  
8. `lib/actions/brand.actions.ts` - Add permission checks
9. `lib/actions/web-page.actions.ts` - Add permission checks
10. `lib/actions/setting.actions.ts` - Add permission checks
11. `lib/actions/inventory.actions.ts` - Enhanced role checks

**Admin UI Components:**
12. `app/[locale]/admin/users/page.tsx` - Add "Create User" button
13. `app/[locale]/admin/users/create/page.tsx` - New user creation page
14. `app/[locale]/admin/users/user-form.tsx` - New reusable form component
15. `app/[locale]/admin/users/[id]/user-edit-form.tsx` - Update role restrictions

**Admin Pages (Add Role Checks):**
16. `app/[locale]/admin/overview/page.tsx`
17. `app/[locale]/admin/orders/page.tsx`
18. `app/[locale]/admin/products/page.tsx`
19. `app/[locale]/admin/categories/page.tsx`
20. `app/[locale]/admin/brands/page.tsx`
21. `app/[locale]/admin/inventory/page.tsx`
22. `app/[locale]/admin/web-pages/page.tsx`
23. `app/[locale]/admin/settings/page.tsx`

**Utility Functions:**
24. `lib/rbac.ts` - New RBAC utility functions
25. `lib/data.ts` - Update sample users with new roles

### Database Tables Affected
- **Users table** - Role field values updated (no schema change)
- **No new tables required** - Using permission-based approach

### API Endpoints Affected
- All admin server actions (indirect via role checks)
- No direct API route changes needed

## Implementation Plan

### Phase 1: Core RBAC Infrastructure (Priority: High)

**Step 1.1: Update Role Definitions**
- Update `lib/constants.ts` with new role structure
- Add permission mappings
- Add role hierarchy definitions

**Step 1.2: Create RBAC Utility Functions**
- Create `lib/rbac.ts` with helper functions:
  - `hasPermission(userRole, permission)`
  - `canAssignRole(currentUserRole, targetRole)`
  - `getRolePermissions(role)`
  - `requirePermission(permission)` - Server action wrapper

**Step 1.3: Update Validation Schemas**
- Update `lib/validator.ts` with new role enum
- Add `AdminUserCreateSchema`
- Update `UserUpdateSchema` role validation

**Step 1.4: Data Migration**
- Create migration script to update existing role values
- Update `lib/data.ts` sample data

### Phase 2: Server Action Protection (Priority: High)

**Step 2.1: Protect User Management Actions**
- Add role checks to `updateUser`, `deleteUser`
- Implement `createUserByAdmin` action
- Add role assignment restrictions

**Step 2.2: Protect Content Management Actions**
- Add permission checks to product actions
- Add permission checks to category/brand actions
- Add permission checks to web-page actions
- Add permission checks to settings actions

**Step 2.3: Enhanced Inventory Protection**
- Update inventory actions with granular role checks
- Ensure proper audit trail for stock changes

### Phase 3: Admin UI Enhancement (Priority: Medium)

**Step 3.1: User Management UI**
- Create user creation page and form
- Update user list with "Create User" button
- Add role-based form field restrictions
- Implement role assignment validation

**Step 3.2: Navigation & Access Control**
- Update admin navigation based on user permissions
- Hide/disable features based on role
- Add permission-based component rendering

**Step 3.3: Page-Level Protection**
- Replace hardcoded 'Admin' checks with permission-based checks
- Add granular access control to admin pages
- Implement graceful permission denied handling

### Phase 4: Testing & Validation (Priority: Medium)

**Step 4.1: Unit Tests**
- Test RBAC utility functions
- Test server action permission checks
- Test role assignment validation

**Step 4.2: Integration Tests**
- Test complete user creation workflow
- Test role-based access scenarios
- Test permission inheritance

**Step 4.3: Security Validation**
- Verify no unauthorized access paths
- Test role escalation prevention
- Validate server action protection

## Testing Strategy

### 1. RBAC Function Testing
```typescript
// Test permission checking
expect(hasPermission('admin', 'users.create')).toBe(true)
expect(hasPermission('seller', 'users.create')).toBe(false)

// Test role assignment validation  
expect(canAssignRole('admin', 'manager')).toBe(true)
expect(canAssignRole('manager', 'admin')).toBe(false)
```

### 2. Server Action Testing
- Test each protected action with different roles
- Verify proper error messages for insufficient permissions
- Test role-based data filtering

### 3. UI Component Testing
- Test form field visibility based on user role
- Test navigation menu filtering
- Test button/action availability

### 4. End-to-End Testing Scenarios

**Admin User:**
- Can create users with any role
- Can access all admin features
- Can modify system settings

**Manager User:**
- Can manage products and orders
- Cannot create/delete users
- Cannot modify system settings

**Seller User:**
- Can view and update products/orders
- Cannot create new products
- Cannot access user management

**Regular User:**
- Can only access account features
- Cannot access admin panel
- Can view own orders only

## Critical Requirements Compliance

### ✅ No Conflicts with Existing Functionality
- Backward compatible role checking
- Existing 'Admin' users will be migrated to 'admin'
- All current features remain accessible to admin users

### ✅ Prevent Code Duplication
- Centralized RBAC utility functions
- Reusable permission checking patterns
- Consistent server action protection wrapper

### ✅ Follow Existing Patterns
- Server actions for all backend operations
- Consistent form components and validation
- Existing admin page layout and styling
- NextAuth.js session management integration

### ✅ Static Role Definition
- Roles defined in backend constants (not UI-configurable)
- Permission mappings hardcoded in application
- No dynamic role creation interface

This implementation plan provides a comprehensive, secure, and maintainable RBAC system that enhances the existing e-commerce platform without breaking current functionality.
