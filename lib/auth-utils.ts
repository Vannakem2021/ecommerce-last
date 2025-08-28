import { isSellerOrHigher } from './rbac-utils'

/**
 * Determines the appropriate redirect URL based on user role
 * Admin, manager, and seller roles redirect to admin dashboard
 * Regular users redirect to the provided callback URL or home page
 */
export function getPostLoginRedirectUrl(userRole: string, callbackUrl?: string): string {
  // Check if user has admin/manager/seller privileges
  if (isSellerOrHigher(userRole)) {
    // Redirect administrative users to admin dashboard
    return '/admin/overview'
  }

  // Regular users go to callback URL or home page
  return callbackUrl && callbackUrl !== '/' ? callbackUrl : '/'
}

/**
 * Check if a user role should be redirected to admin area
 */
export function shouldRedirectToAdmin(userRole: string): boolean {
  return isSellerOrHigher(userRole)
}
