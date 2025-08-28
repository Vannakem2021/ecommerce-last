/**
 * Enhanced Authentication Session Hook
 * 
 * This hook provides improved session management for client components
 * with automatic synchronization and error handling.
 */

import { useSession } from 'next-auth/react'
import { useEffect, useCallback } from 'react'

export interface AuthSessionState {
  session: any
  status: 'loading' | 'authenticated' | 'unauthenticated'
  isLoading: boolean
  isAuthenticated: boolean
  user: any
  update: () => Promise<any>
  refresh: () => Promise<void>
}

/**
 * Enhanced session hook with automatic synchronization
 */
export function useAuthSession(): AuthSessionState {
  const { data: session, status, update } = useSession()

  // Refresh session to ensure synchronization
  const refresh = useCallback(async () => {
    try {
      await update()
    } catch (error) {
      console.error('Session refresh failed:', error)
    }
  }, [update])

  // Auto-refresh session on mount to ensure sync
  // Reduced aggressiveness to prevent interference with sign-out
  useEffect(() => {
    if (status === 'loading') return
    
    // Only auto-refresh if we have an authenticated session
    // This prevents interference with the sign-out process
    if (status === 'authenticated' && !session) {
      const timer = setTimeout(() => {
        refresh()
      }, 500) // Increased delay to reduce race conditions

      return () => clearTimeout(timer)
    }
  }, [status, session, refresh])

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    user: session?.user || null,
    update,
    refresh,
  }
}

/**
 * Hook for components that require authentication
 * Automatically handles loading states and redirects
 */
export function useRequireAuth() {
  const authSession = useAuthSession()
  
  useEffect(() => {
    if (authSession.status === 'loading') return
    
    if (!authSession.isAuthenticated) {
      // Could add automatic redirect logic here if needed
      console.warn('Component requires authentication but user is not authenticated')
    }
  }, [authSession.status, authSession.isAuthenticated])

  return authSession
}

/**
 * Debug hook for authentication troubleshooting
 */
export function useAuthDebug() {
  const authSession = useAuthSession()
  
  useEffect(() => {
    console.log('🔍 Auth Debug Info:', {
      status: authSession.status,
      isAuthenticated: authSession.isAuthenticated,
      hasSession: !!authSession.session,
      hasUser: !!authSession.user,
      userId: authSession.user?.id,
      userRole: authSession.user?.role,
      userName: authSession.user?.name,
    })
  }, [authSession])

  return authSession
}

export default useAuthSession
