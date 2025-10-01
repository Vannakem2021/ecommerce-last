'use client'
import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useLocale } from 'next-intl'

import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export function GoogleSignInForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [isLoading, setIsLoading] = useState(false)
  const locale = useLocale()

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)

      // Validate callback URL to prevent open redirect attacks
      const safeCallbackUrl = callbackUrl.startsWith('/') ? callbackUrl : '/'

      // Get current locale with fallback to default
      let currentLocale = locale;
      try {
        // Ensure we have a valid locale
        if (!currentLocale || typeof currentLocale !== 'string') {
          currentLocale = 'en-US'; // fallback to default
        }
      } catch (localeError) {
        console.warn('Failed to detect locale, using default:', localeError);
        currentLocale = 'en-US';
      }

      // Construct locale-aware callback URL
      const localeAwareCallbackUrl = `/${currentLocale}/auth/post-signin?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`;

      // Use NextAuth's signIn with proper CSRF protection and state validation
      // Role-based redirects for OAuth are handled by the locale-aware post-signin page
      await signIn('google', {
        callbackUrl: localeAwareCallbackUrl,
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
        className='w-full h-12 sm:h-14 text-base sm:text-lg'
        variant='outline'
        onClick={handleGoogleSignIn}
        type="button"
      >
        {loading ? (
          <>
            <Loader2 className='mr-2 h-5 w-5 sm:h-6 sm:w-6 animate-spin' />
            Redirecting to Google...
          </>
        ) : (
          <>
            <svg className='mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7' viewBox='0 0 24 24'>
              <path
                fill='currentColor'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='currentColor'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='currentColor'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              />
              <path
                fill='currentColor'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              />
            </svg>
            Sign In with Google
          </>
        )}
      </Button>
    )
  }

  return (
    <div className='space-y-3'>
      <SignInButton />
      <Button
        disabled={isLoading}
        className='w-full h-12 sm:h-14 text-base sm:text-lg'
        variant='outline'
        type="button"
      >
        <svg className='mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7' fill='#1877F2' viewBox='0 0 24 24'>
          <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/>
        </svg>
        Continue with Facebook
      </Button>
    </div>
  )
}
