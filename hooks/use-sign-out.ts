/**
 * Enhanced Sign-Out Hook for NextAuth v5
 * 
 * This hook provides proper sign-out functionality with CSRF token handling
 * and reliable session cleanup for NextAuth v5 beta.25
 */

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { toast } from './use-toast'

export interface SignOutOptions {
  callbackUrl?: string
  redirectTo?: string
}

export function useSignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()

  const signOutUser = useCallback(async (options?: SignOutOptions) => {
    if (isSigningOut) return // Prevent multiple concurrent sign-out attempts
    
    try {
      setIsSigningOut(true)
      
      // Perform sign-out (NextAuth v5 beta.25 handles CSRF internally)
      const result = await signOut({
        redirect: false,
        callbackUrl: options?.callbackUrl || options?.redirectTo || '/'
      })

      // Force clear any cached session data
      if (typeof window !== 'undefined') {
        // Clear any custom session storage
        localStorage.removeItem('nextauth.session-token')
        sessionStorage.clear()
        
        // Clear cart data from localStorage to prevent cross-session persistence
        localStorage.removeItem('cart-store')
        
        // Force cookies to be cleared by setting them with past expiration
        const cookieName = process.env.NODE_ENV === 'production' 
          ? '__Secure-authjs.session-token' 
          : 'authjs.session-token'
          
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=lax`
        
        // Also clear the callback URL cookie if it exists
        document.cookie = 'authjs.callback-url=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=lax'
      }

      // Navigate to the destination
      if (result?.url) {
        router.push(result.url)
        router.refresh() // Force a refresh to ensure server state is updated
      } else {
        router.push(options?.callbackUrl || options?.redirectTo || '/')
        router.refresh()
      }
      
    } catch (error) {
      console.error('Sign-out error:', error)
      toast({
        title: 'Sign-out Error',
        description: 'There was an issue signing you out. Please try again.',
        variant: 'destructive',
      })
      
      // Fallback: try server-side redirect sign-out
      try {
        await signOut({ 
          callbackUrl: options?.callbackUrl || options?.redirectTo || '/'
        })
      } catch (fallbackError) {
        console.error('Fallback sign-out also failed:', fallbackError)
        // Last resort: force navigation to home
        router.push('/')
        router.refresh()
      }
    } finally {
      setIsSigningOut(false)
    }
  }, [isSigningOut, router])

  return {
    signOut: signOutUser,
    isSigningOut
  }
}

export default useSignOut