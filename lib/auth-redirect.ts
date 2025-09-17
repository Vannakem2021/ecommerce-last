import { isSellerOrHigher } from './rbac-utils';

/**
 * Validate callback URL to prevent open redirect attacks
 */
function validateCallbackUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;

  // Only allow relative URLs that start with /
  if (!url.startsWith('/')) return null;

  // Prevent protocol-relative URLs
  if (url.startsWith('//')) return null;

  // Prevent javascript: and data: URLs
  if (url.toLowerCase().includes('javascript:') || url.toLowerCase().includes('data:')) {
    return null;
  }

  // Whitelist of allowed redirect patterns
  const allowedPatterns = [
    /^\/$/,                                                    // Root
    /^\/[a-z]{2}(-[A-Z]{2})?$/,                               // Locale root
    /^\/[a-z]{2}(-[A-Z]{2})?\/(admin|account|checkout|favorites|cart|product|search)(\/.*)?$/, // Locale-aware paths
    /^\/admin(\/.*)?$/,                                        // Admin paths
    /^\/account(\/.*)?$/,                                      // Account paths
    /^\/checkout(\/.*)?$/,                                     // Checkout paths
    /^\/favorites(\/.*)?$/,                                    // Favorites paths
    /^\/cart(\/.*)?$/,                                         // Cart paths
    /^\/product\/[a-zA-Z0-9-]+(\/.*)?$/,                      // Product pages
    /^\/search(\?.*)?$/,                                       // Search pages
  ];

  const isAllowed = allowedPatterns.some(pattern => pattern.test(url));
  return isAllowed ? url : null;
}

/**
 * Get the appropriate redirect URL based on user role
 * @param role - User role string
 * @param callbackUrl - Optional callback URL from search params
 * @returns The URL to redirect to
 */
export function getRoleBasedRedirectUrl(role: string, callbackUrl?: string | null): string {
  // System users (admin, manager, seller) always go to admin regardless of callback URL
  if (isSellerOrHigher(role)) {
    console.log(`System user (${role}) redirecting to admin dashboard`);
    return "/admin";
  }

  // For regular users, validate and use callback URL if available
  const safeCallbackUrl = validateCallbackUrl(callbackUrl);
  if (safeCallbackUrl && safeCallbackUrl !== "/" && safeCallbackUrl !== "") {
    console.log(`Regular user redirecting to validated callback URL: ${safeCallbackUrl}`);
    return safeCallbackUrl;
  }

  console.log(`Regular user redirecting to home page`);
  return "/"; // Regular users go to home page
}

/**
 * Get post-login redirect URL with role-based priority
 * @param role - User role string
 * @param callbackUrl - Optional callback URL
 * @returns The URL to redirect to after login
 */
export function getPostLoginRedirectUrl(role: string, callbackUrl?: string | null): string {
  // System users always go to admin, regardless of callback URL
  if (shouldOverrideCallbackUrl(role)) {
    console.log(`Post-login: System user (${role}) redirecting to admin`);
    return "/admin";
  }

  // Regular users can use callback URL or default to home
  const safeCallbackUrl = validateCallbackUrl(callbackUrl);
  const redirectUrl = safeCallbackUrl && safeCallbackUrl !== "/" ? safeCallbackUrl : "/";
  console.log(`Post-login: Regular user redirecting to ${redirectUrl}`);
  return redirectUrl;
}

/**
 * Determine if role-based redirect should override callback URL
 * @param role - User role string
 * @returns True if role-based redirect should take precedence
 */
export function shouldOverrideCallbackUrl(role: string): boolean {
  return isSellerOrHigher(role);
}

/**
 * Check if the user should be redirected to admin based on their role
 * @param role - User role string
 * @returns True if user should be redirected to admin
 */
export function shouldRedirectToAdmin(role: string): boolean {
  return isSellerOrHigher(role);
}

/**
 * Validate redirect URL for security
 * @param url - URL to validate
 * @returns True if URL is safe for redirect
 */
export function isValidRedirectUrl(url: string): boolean {
  return validateCallbackUrl(url) !== null;
}