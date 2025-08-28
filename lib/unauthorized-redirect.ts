import { redirect } from 'next/navigation'

export type UnauthorizedReason = 'authentication-required' | 'insufficient-role' | 'access-denied'

/**
 * Redirect to unauthorized page with appropriate reason and context
 * @param reason - The reason for the unauthorized access
 * @param from - The path the user was trying to access (optional)
 */
export function redirectToUnauthorized(reason: UnauthorizedReason = 'access-denied', from?: string): never {
  const params = new URLSearchParams()
  params.set('reason', reason)
  
  if (from) {
    params.set('from', from)
  }
  
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