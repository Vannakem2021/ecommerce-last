'use client'
import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { signIn } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { getPostLoginRedirectUrl } from '@/lib/auth-redirect'

export function GoogleSignInForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)

      // Validate callback URL to prevent open redirect attacks
      const safeCallbackUrl = callbackUrl.startsWith('/') ? callbackUrl : '/'

      // Use NextAuth's signIn with proper CSRF protection and state validation
      // Role-based redirects for OAuth are handled by the post-signin page
      await signIn('google', {
        callbackUrl: `/auth/post-signin?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`,
        redirect: true, // Let NextAuth handle the redirect to post-signin page
      })
    } catch (error) {
      setIsLoading(false)
      console.error('Google sign-in error:', error)
      toast({
        title: 'Sign In Failed',
        description: 'Failed to sign in with Google. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const SignInButton = () => {
    const { pending } = useFormStatus()
    const loading = pending || isLoading

    return (
      <Button
        disabled={loading}
        className='w-full'
        variant='outline'
        onClick={handleGoogleSignIn}
        type="button"
      >
        {loading ? 'Redirecting to Google...' : 'Sign In with Google'}
      </Button>
    )
  }

  return (
    <div>
      <SignInButton />
    </div>
  )
}
