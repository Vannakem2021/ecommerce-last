import { redirect } from 'next/navigation'

export type UnauthorizedReason = 'authentication-required' | 'insufficient-role' | 'access-denied'

/**
 * Validate redirect path to prevent open redirect vulnerabilities
 */
function validateRedirectPath(path?: string): string | undefined {
  if (!path) return undefined;

  // Only allow relative paths that start with /
  if (!path.startsWith('/')) return undefined;

  // Prevent protocol-relative URLs
  if (path.startsWith('//')) return undefined;

  // Whitelist of allowed path patterns
  const allowedPaths = [
    /^\/admin(\/.*)?$/,
    /^\/account(\/.*)?$/,
    /^\/checkout(\/.*)?$/,
    /^\/favorites(\/.*)?$/,
    /^\/[a-z]{2}(-[A-Z]{2})?\/(admin|account|checkout|favorites)(\/.*)?$/, // Locale-aware paths
  ];

  const isAllowed = allowedPaths.some(pattern => pattern.test(path));
  return isAllowed ? path : undefined;
}

/**
 * Redirect to unauthorized page with appropriate reason and context
 * @param reason - The reason for the unauthorized access
 * @param from - The path the user was trying to access (optional)
 */
export function redirectToUnauthorized(reason: UnauthorizedReason = 'access-denied', from?: string): never {
  const params = new URLSearchParams()
  params.set('reason', reason)

  // Validate and sanitize the from parameter
  const safePath = validateRedirectPath(from);
  if (safePath) {
    params.set('from', safePath)
  }

  // Log unauthorized access attempts for security monitoring
  console.warn(`Unauthorized access attempt: ${reason}${from ? ` from ${from}` : ''}`);

  redirect(`/unauthorized?${params.toString()}`)
}

/**
 * Redirect to unauthorized page for insufficient role/permissions
 * @param from - The path the user was trying to access (optional)
 */
export function redirectInsufficientRole(from?: string): never {
  redirectToUnauthorized('insufficient-role', from)
}

/**
 * Redirect to unauthorized page for authentication required
 * @param from - The path the user was trying to access (optional)
 */
export function redirectAuthenticationRequired(from?: string): never {
  redirectToUnauthorized('authentication-required', from)
}