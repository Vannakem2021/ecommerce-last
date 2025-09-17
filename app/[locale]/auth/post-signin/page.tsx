'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getPostLoginRedirectUrl } from '@/lib/auth-redirect'

export default function PostSignInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (status === 'loading') {
      // Still loading session
      return
    }

    if (status === 'unauthenticated') {
      // Not authenticated, redirect to sign-in
      router.replace('/sign-in')
      return
    }

    if (session?.user?.role) {
      // Get callback URL from search params
      const callbackUrl = searchParams.get('callbackUrl')
      
      // Get role-based redirect URL
      const redirectUrl = getPostLoginRedirectUrl(session.user.role, callbackUrl)
      
      // Redirect to appropriate page
      router.replace(redirectUrl)
    } else {
      // Fallback redirect if role is not available
      router.replace('/')
    }
  }, [session, status, router, searchParams])

  // Show loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
