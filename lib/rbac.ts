'use server'

import { auth } from '@/auth'
import { ROLE_HIERARCHY, type UserRole, type Permission } from './constants'
import { hasPermission, canAssignRole, isAdmin, isManagerOrHigher } from './rbac-utils'

/**
 * Server action wrapper that requires a specific permission
 * Throws an error if the current user doesn't have the required permission
 */
export async function requirePermission(permission: Permission, redirectPath?: string): Promise<void> {
  const session = await auth()
  
  if (!session?.user?.id) {
    const { redirectAuthenticationRequired } = await import('./unauthorized-redirect')
    redirectAuthenticationRequired(redirectPath)
  }
  
  if (!session.user.role) {
    throw new Error('User role not found')
  }
  
  if (!hasPermission(session.user.role, permission)) {
    const { redirectInsufficientRole } = await import('./unauthorized-redirect')
    redirectInsufficientRole(redirectPath)
  }
}

/**
 * Server action wrapper that requires admin role
 */
export async function requireAdmin(redirectPath?: string): Promise<void> {
  const session = await auth()
  
  if (!session?.user?.id) {
    const { redirectAuthenticationRequired } = await import('./unauthorized-redirect')
    redirectAuthenticationRequired(redirectPath)
  }
  
  if (!isAdmin(session.user.role)) {
    const { redirectInsufficientRole } = await import('./unauthorized-redirect')
    redirectInsufficientRole(redirectPath)
  }
}

/**
 * Server action wrapper that requires manager or higher role
 */
export async function requireManagerOrHigher(redirectPath?: string): Promise<void> {
  const session = await auth()
  
  if (!session?.user?.id) {
    const { redirectAuthenticationRequired } = await import('./unauthorized-redirect')
    redirectAuthenticationRequired(redirectPath)
  }
  
  if (!isManagerOrHigher(session.user.role)) {
    const { redirectInsufficientRole } = await import('./unauthorized-redirect')
    redirectInsufficientRole(redirectPath)
  }
}

/**
 * Get current user's session with role validation
 */
export async function getCurrentUserWithRole() {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }
  
  if (!session.user.role) {
    throw new Error('User role not found')
  }
  
  return {
    ...session.user,
    role: session.user.role.toLowerCase() as UserRole
  }
}

/**
 * Check if current user can perform an action on a target user
 * Prevents privilege escalation and unauthorized role changes
 */
export async function canManageUser(targetUserRole: string): Promise<boolean> {
  try {
    const currentUser = await getCurrentUserWithRole()
    const targetRole = targetUserRole.toLowerCase() as UserRole
    
    const currentHierarchy = ROLE_HIERARCHY[currentUser.role]
    const targetHierarchy = ROLE_HIERARCHY[targetRole]
    
    // Users can only manage users with equal or lower hierarchy
    return currentHierarchy >= targetHierarchy
  } catch {
    return false
  }
}

/**
 * Validate role assignment in user management operations
 */
export async function validateRoleAssignment(targetRole: string): Promise<void> {
  const currentUser = await getCurrentUserWithRole()
  
  if (!canAssignRole(currentUser.role, targetRole)) {
    throw new Error(`Cannot assign role '${targetRole}'. Insufficient privileges.`)
  }
}


