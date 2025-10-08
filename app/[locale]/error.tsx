'use client'
import React, { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { ShieldX, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations()

  // Log errors for debugging (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by error boundary:', error)
    }
  }, [error])

  // Handle Next.js redirect errors (NEXT_REDIRECT)
  const isRedirectError = error?.digest?.includes('NEXT_REDIRECT')
  
  // Handle permission/authorization errors
  const isPermissionError = 
    error.message?.toLowerCase().includes('permission') ||
    error.message?.toLowerCase().includes('unauthorized') ||
    error.message?.toLowerCase().includes('insufficient') ||
    error.message?.toLowerCase().includes('access denied')

  // Get user-friendly error message
  const getErrorMessage = () => {
    if (isRedirectError) {
      return 'You are being redirected. If this page persists, please try refreshing or going back to the home page.'
    }
    
    if (isPermissionError) {
      return 'You do not have permission to access this resource. Please contact an administrator if you believe this is an error.'
    }

    // Show original error in development, generic message in production
    if (process.env.NODE_ENV === 'development') {
      return error.message || 'An unexpected error occurred.'
    }
    
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.'
  }

  const getErrorTitle = () => {
    if (isPermissionError) {
      return 'Access Denied'
    }
    if (isRedirectError) {
      return 'Redirecting...'
    }
    return t('Error.Error')
  }

  const ErrorIcon = isPermissionError ? ShieldX : AlertCircle

  // Auto-redirect if it's a redirect error
  useEffect(() => {
    if (isRedirectError) {
      const timer = setTimeout(() => {
        window.location.href = '/'
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isRedirectError])

  return (
    <div className='flex flex-col items-center justify-center min-h-screen px-4'>
      <div className='w-full max-w-md'>
        <Card className={isPermissionError ? 'border-destructive/20' : ''}>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <ErrorIcon className={`h-16 w-16 ${isPermissionError ? 'text-destructive' : 'text-yellow-500'}`} />
            </div>
            <CardTitle className={`text-2xl font-bold text-center ${isPermissionError ? 'text-destructive' : ''}`}>
              {getErrorTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className='text-center text-muted-foreground text-sm'>
              {getErrorMessage()}
            </p>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && !isRedirectError && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              {!isRedirectError && (
                <>
                  <Button 
                    variant='outline' 
                    className='w-full' 
                    onClick={() => reset()}
                  >
                    {t('Error.Try again')}
                  </Button>
                  <Button
                    className='w-full'
                    onClick={() => (window.location.href = '/')}
                  >
                    {t('Error.Back To Home')}
                  </Button>
                </>
              )}
              {isRedirectError && (
                <p className="text-center text-sm text-muted-foreground">
                  Redirecting to home page in 2 seconds...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
