'use client'
import React, { useEffect } from 'react'
import Link from 'next/link'
import { ShieldX, Home, ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
export default function UnauthorizedPage() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const from = searchParams.get('from')

  // Security monitoring - log unauthorized page visits
  useEffect(() => {
    // Only log in production for security monitoring
    if (process.env.NODE_ENV === 'production') {
      console.warn(`Unauthorized page accessed: ${reason}${from ? ` from ${from}` : ''}`);
    }
  }, [reason, from]);

  const getErrorMessage = () => {
    switch (reason) {
      case 'insufficient-role':
        return 'Your current role does not have the required permissions to access this page or perform this action. If you need access, please contact your system administrator.'
      case 'authentication-required':
        return 'You must be signed in to access this page. Please sign in with your account to continue.'
      default:
        return 'Access to this page is restricted. You do not have the necessary permissions to view this content.'
    }
  }

  const getDetailedMessage = () => {
    switch (reason) {
      case 'insufficient-role':
        return 'This typically means you need a higher role (Manager or Admin) to access this resource. Contact your administrator to request elevated permissions.'
      case 'authentication-required':
        return 'Authentication is required to protect sensitive information and ensure secure access.'
      default:
        return 'If you believe you should have access, please verify you are signed in with the correct account.'
    }
  }

  const getTitle = () => {
    if (reason === 'authentication-required') {
      return 'Sign In Required'
    }
    return 'Access Denied'
  }

  const getStatusCode = () => {
    if (reason === 'authentication-required') {
      return '401'
    }
    return '403'
  }

  return (
    <>
      {/* SEO and security headers */}
      <title>{getTitle()} - {getStatusCode()}</title>
      <meta name="robots" content="noindex, nofollow" />

      <div className='flex flex-col items-center justify-center min-h-screen px-4'>
        <div className='p-8 rounded-lg shadow-md max-w-md w-full text-center'>
          <Card className="border-destructive/20">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <ShieldX className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold text-destructive">
                {getTitle()}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Error {getStatusCode()}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-foreground text-sm font-medium">
                  {getErrorMessage()}
                </p>
                <p className="text-muted-foreground text-xs">
                  {getDetailedMessage()}
                </p>
              </div>

              {/* Show the attempted path if available */}
              {from && (
                <div className="p-3 bg-muted/50 rounded-md border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Attempted to access:</span>
                  </p>
                  <p className="text-xs font-mono text-foreground mt-1 break-all">
                    {from}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4">
                {reason === 'authentication-required' ? (
                  <Link href={`/sign-in${from ? `?callbackUrl=${encodeURIComponent(from)}` : ''}`}>
                    <Button className="w-full">
                      Sign In
                    </Button>
                  </Link>
                ) : (
                  <Link href="/">
                    <Button className="w-full">
                      <Home className="w-4 h-4 mr-2" />
                      Return Home
                    </Button>
                  </Link>
                )}

                {from && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Validate history navigation for security
                      if (window.history.length > 1) {
                        window.history.back();
                      } else {
                        window.location.href = '/';
                      }
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                )}

                {reason !== 'authentication-required' && (
                  <Link href="/sign-in">
                    <Button variant="outline" className="w-full">
                      Sign In with Different Account
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}