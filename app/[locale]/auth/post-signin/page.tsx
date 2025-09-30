'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { getPostLoginRedirectUrl } from '@/lib/auth-redirect'

export default function PostSignInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const [redirectAttempted, setRedirectAttempted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeoutReached, setTimeoutReached] = useState(false)

  useEffect(() => {
    // Set timeout for authentication waiting
    const authTimeout = setTimeout(() => {
      if (status === 'loading' && !redirectAttempted) {
        console.warn('Authentication timeout reached, redirecting to fallback');
        setTimeoutReached(true);
        setError('Authentication is taking longer than expected');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(authTimeout);
  }, [status, redirectAttempted]);

  useEffect(() => {
    // Prevent multiple redirect attempts
    if (redirectAttempted) return;

    const handleRedirect = async () => {
      try {
        if (status === 'loading' && !timeoutReached) {
          // Still loading session, wait unless timeout reached
          return;
        }

        if (status === 'unauthenticated' || timeoutReached) {
          // Not authenticated or timeout reached, redirect to sign-in
          console.log('Redirecting to sign-in: unauthenticated or timeout');
          setRedirectAttempted(true);
          router.replace(`/${locale}/sign-in`);
          return;
        }

        if (session?.user) {
          // Check if user has required data
          const userRole = session.user.role;
          const userEmail = session.user.email;

          if (!userEmail) {
            console.error('User session missing email, redirecting to sign-in');
            setError('Session data incomplete');
            setRedirectAttempted(true);
            router.replace(`/${locale}/sign-in`);
            return;
          }

          // Log successful authentication
          console.log(`User authenticated: ${userEmail} with role: ${userRole || 'user'}`);

          // Get callback URL from search params with validation
          let callbackUrl = searchParams.get('callbackUrl');

          // Validate callback URL for security
          if (callbackUrl && !callbackUrl.startsWith('/')) {
            console.warn('Invalid callback URL detected, using fallback');
            callbackUrl = null;
          }

          try {
            // Get role-based redirect URL with error handling
            const redirectUrl = getPostLoginRedirectUrl(userRole || 'user', callbackUrl);

            console.log(`Redirecting to: ${redirectUrl}`);
            setRedirectAttempted(true);

            // Use replace to prevent back button issues
            router.replace(redirectUrl);
          } catch (redirectError) {
            console.error('Error getting redirect URL:', redirectError);
            setError('Failed to determine redirect destination');

            // Fallback to home page
            setRedirectAttempted(true);
            router.replace(`/${locale}`);
          }
        } else if (status === 'authenticated' && !session?.user) {
          // Edge case: authenticated but no user data
          console.error('Authenticated but no user data available');
          setError('Session corrupted');
          setRedirectAttempted(true);
          router.replace(`/${locale}/sign-in`);
        }
      } catch (globalError) {
        console.error('Unexpected error in post-signin redirect:', globalError);
        setError('An unexpected error occurred');
        setRedirectAttempted(true);
        router.replace(`/${locale}`);
      }
    };

    handleRedirect();
  }, [session, status, router, searchParams, redirectAttempted, timeoutReached]);

  // Error recovery effect
  useEffect(() => {
    if (error && !redirectAttempted) {
      const errorRecoveryTimer = setTimeout(() => {
        console.log('Attempting error recovery redirect');
        setRedirectAttempted(true);
        router.replace(`/${locale}`);
      }, 3000);

      return () => clearTimeout(errorRecoveryTimer);
    }
  }, [error, redirectAttempted, router]);

  // Show loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {error ? (
          <>
            <div className="text-red-500 mb-4">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 mb-2 font-medium">Authentication Error</p>
            <p className="text-muted-foreground text-sm mb-4">{error}</p>
            <p className="text-muted-foreground text-xs">Redirecting to home page...</p>
          </>
        ) : timeoutReached ? (
          <>
            <div className="text-yellow-500 mb-4">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-yellow-600 mb-2 font-medium">Taking longer than expected</p>
            <p className="text-muted-foreground text-sm">Redirecting to sign-in...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground mb-2">Processing authentication...</p>
            <p className="text-muted-foreground text-sm">Please wait while we redirect you</p>
          </>
        )}
      </div>
    </div>
  )
}
