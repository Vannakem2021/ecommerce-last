/**
 * Enhanced Authentication Session Hook
 *
 * This hook provides improved session management for client components
 * with secure session handling and proper TypeScript types.
 */

import { useSession, Session } from 'next-auth/react'
import { useEffect, useCallback } from 'react'

export interface AuthUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role: string
}

export interface AuthSessionState {
  session: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  isLoading: boolean
  isAuthenticated: boolean
  user: AuthUser | null
  update: () => Promise<Session | null>
  refresh: () => Promise<void>
}

/**
 * Enhanced session hook with secure session management
 */
export function useAuthSession(): AuthSessionState {
  const { data: session, status, update } = useSession()

  // Simplified refresh function - rely on NextAuth's built-in mechanisms
  const refresh = useCallback(async () => {
    try {
      await update()
    } catch (error) {
      console.error('Session refresh failed:', error)
    }
  }, [update])

  // Cleanup effect for component unmounting
  useEffect(() => {
    return () => {
      // Cleanup any pending operations when component unmounts
    }
  }, [])

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated' && !!session?.user,
    user: session?.user as AuthUser | null,
    update,
    refresh,
  }
}

/**
 * Hook for components that require authentication
 * Throws during render when unauthenticated
 */
export function useRequireAuth() {
  const authSession = useAuthSession()

  if (authSession.status !== 'loading' && !authSession.isAuthenticated) {
    throw new Error('Authentication required')
  }

  return authSession
}

/**
 * Debug hook for authentication troubleshooting (development only)
 */
export function useAuthDebug() {
  const authSession = useAuthSession()

  useEffect(() => {
    // Only log in development environment
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Auth Debug Info:', {
        status: authSession.status,
        isAuthenticated: authSession.isAuthenticated,
        hasSession: !!authSession.session,
        hasUser: !!authSession.user,
        userId: authSession.user?.id,
        userRole: authSession.user?.role,
        userName: authSession.user?.name,
      })
    }
  }, [authSession])

  return authSession
}

export default useAuthSession
