import { isSellerOrHigher } from './rbac-utils';

/**
 * Get the appropriate redirect URL based on user role
 * @param role - User role string
 * @param callbackUrl - Optional callback URL from search params
 * @returns The URL to redirect to
 */
export function getRoleBasedRedirectUrl(role: string, callbackUrl?: string | null): string {
  // If there's a specific callback URL that isn't just the root, use it
  if (callbackUrl && callbackUrl !== "/" && callbackUrl !== "") {
    return callbackUrl;
  }
  
  // Role-based default redirects
  if (isSellerOrHigher(role)) {
    return "/admin";
  }
  
  return "/"; // Regular users go to home page
}

/**
 * Check if the user should be redirected to admin based on their role
 * @param role - User role string
 * @returns True if user should be redirected to admin
 */
export function shouldRedirectToAdmin(role: string): boolean {
  return isSellerOrHigher(role);
}