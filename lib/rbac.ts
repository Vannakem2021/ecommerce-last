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
    console.warn(`Authorization failed: Authentication required for permission ${permission}`)
    const { redirectAuthenticationRequired } = await import('./unauthorized-redirect')
    redirectAuthenticationRequired(redirectPath)
  }

  if (!session.user.role || typeof session.user.role !== 'string') {
    console.error(`Authorization failed: Invalid or missing role for user ${session.user.id}`)
    throw new Error('User role not found or invalid')
  }

  if (!hasPermission(session.user.role, permission)) {
    console.warn(`Authorization failed: User ${session.user.id} with role ${session.user.role} lacks permission ${permission}`)
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
 * Validate session and ensure it's properly authenticated
 */
export async function requireValidSession() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  if (!session.user.role || typeof session.user.role !== 'string') {
    throw new Error('User role not found or invalid')
  }

  return session
}

/**
 * Get current user's session with role validation
 */
export async function getCurrentUserWithRole() {
  const session = await requireValidSession()

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

    // Validate target role exists in hierarchy
    if (!ROLE_HIERARCHY.hasOwnProperty(targetRole)) {
      console.warn(`Invalid target role: ${targetRole}`)
      return false
    }

    const currentHierarchy = ROLE_HIERARCHY[currentUser.role]
    const targetHierarchy = ROLE_HIERARCHY[targetRole]

    // Users can only manage users with lower hierarchy (not equal)
    const canManage = currentHierarchy > targetHierarchy

    if (!canManage) {
      console.warn(`User ${currentUser.id} (${currentUser.role}) cannot manage user with role ${targetRole}`)
    }

    return canManage
  } catch (error) {
    console.error('Error in canManageUser:', error)
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


