import { ROLE_HIERARCHY, ROLE_PERMISSIONS, USER_ROLES, type UserRole, type Permission } from './constants'

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  if (!userRole || !permission) return false
  
  const role = userRole.toLowerCase() as UserRole
  const rolePermissions = ROLE_PERMISSIONS[role]
  
  if (!rolePermissions) return false
  
  return rolePermissions.includes(permission)
}

/**
 * Check if a user can assign a specific role to another user
 * Users can only assign roles equal to or lower than their own hierarchy level
 */
export function canAssignRole(currentUserRole: string, targetRole: string): boolean {
  if (!currentUserRole || !targetRole) return false
  
  const currentRole = currentUserRole.toLowerCase() as UserRole
  const target = targetRole.toLowerCase() as UserRole
  
  const currentHierarchy = ROLE_HIERARCHY[currentRole]
  const targetHierarchy = ROLE_HIERARCHY[target]
  
  if (!currentHierarchy || !targetHierarchy) return false
  
  // Users can assign roles equal to or lower than their own
  return currentHierarchy >= targetHierarchy
}

/**
 * Get all permissions for a specific role
 */
export function getRolePermissions(userRole: string): Permission[] {
  if (!userRole) return []
  
  const role = userRole.toLowerCase() as UserRole
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Get roles that a user can assign to others
 */
export function getAssignableRoles(currentUserRole: string): UserRole[] {
  if (!currentUserRole) return []
  
  const currentRole = currentUserRole.toLowerCase() as UserRole
  const currentHierarchy = ROLE_HIERARCHY[currentRole]
  
  if (!currentHierarchy) return []
  
  return Object.entries(ROLE_HIERARCHY)
    .filter(([, hierarchy]) => hierarchy <= currentHierarchy)
    .map(([role]) => role as UserRole)
}

/**
 * Check if a user has admin privileges (admin role)
 */
export function isAdmin(userRole: string): boolean {
  return userRole?.toLowerCase() === USER_ROLES.ADMIN
}

/**
 * Check if a user has manager or higher privileges
 */
export function isManagerOrHigher(userRole: string): boolean {
  if (!userRole) return false
  
  const role = userRole.toLowerCase() as UserRole
  const hierarchy = ROLE_HIERARCHY[role]
  
  return hierarchy >= ROLE_HIERARCHY.manager
}

/**
 * Check if a user has seller or higher privileges
 */
export function isSellerOrHigher(userRole: string): boolean {
  if (!userRole) return false
  
  const role = userRole.toLowerCase() as UserRole
  const hierarchy = ROLE_HIERARCHY[role]
  
  return hierarchy >= ROLE_HIERARCHY.seller
}

/**
 * Legacy compatibility function - maps old role format to new format
 */
export function normalizeRole(role: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    'Admin': 'admin',
    'User': 'user',
    'admin': 'admin',
    'manager': 'manager',
    'seller': 'seller',
    'user': 'user'
  }

  const normalizedRole = roleMap[role]
  return normalizedRole || 'user'
}

/**
 * Check if a user with given role can manage a target user role
 * This version doesn't call auth() and is more efficient for bulk operations
 */
export function canUserRoleManageTargetRole(currentUserRole: string, targetUserRole: string): boolean {
  try {
    const currentRole = currentUserRole.toLowerCase() as UserRole
    const targetRole = targetUserRole.toLowerCase() as UserRole

    // Validate roles exist in hierarchy
    if (!ROLE_HIERARCHY.hasOwnProperty(currentRole) || !ROLE_HIERARCHY.hasOwnProperty(targetRole)) {
      return false
    }

    const currentHierarchy = ROLE_HIERARCHY[currentRole]
    const targetHierarchy = ROLE_HIERARCHY[targetRole]

    // Users can only manage users with lower hierarchy (not equal)
    return currentHierarchy > targetHierarchy
  } catch (error) {
    console.error('Error in canUserRoleManageTargetRole:', error)
    return false
  }
}
