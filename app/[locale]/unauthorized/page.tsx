'use client'
import React from 'react'
import Link from 'next/link'
import { ShieldX, Home, ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
export default function UnauthorizedPage() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const from = searchParams.get('from')

  const getErrorMessage = () => {
    if (reason === 'insufficient-role') {
      return 'You do not have the required permissions to access this resource. Please contact an administrator if you believe this is an error.'
    }
    if (reason === 'authentication-required') {
      return 'You must be signed in to access this resource.'
    }
    return 'Access to this resource is restricted. You do not have the necessary permissions.'
  }

  const getTitle = () => {
    if (reason === 'authentication-required') {
      return 'Sign In Required'
    }
    return 'Access Denied'
  }

  return (
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
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {getErrorMessage()}
            </p>
            
            <div className="flex flex-col gap-3 pt-4">
              {reason === 'authentication-required' ? (
                <Link href="/sign-in">
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
                  onClick={() => window.history.back()}
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
  )
}