'use client'
import React from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldX, Home, LogIn } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  const t = useTranslations('Unauthorized')
  const { data: session } = useSession()

  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <ShieldX className='h-16 w-16 text-destructive' />
          </div>
          <CardTitle className='text-2xl font-bold text-destructive'>
            {t('Access Denied')}
          </CardTitle>
        </CardHeader>
        <CardContent className='text-center space-y-4'>
          <p className='text-muted-foreground'>
            {t('Insufficient Permissions')}
          </p>
          <p className='text-sm text-muted-foreground'>
            {t('Contact Admin')}
          </p>
          
          <div className='flex flex-col gap-2 pt-4'>
            <Button asChild variant='default'>
              <Link href='/'>
                <Home className='h-4 w-4 mr-2' />
                {t('Back To Home')}
              </Link>
            </Button>
            
            {!session && (
              <Button asChild variant='outline'>
                <Link href='/sign-in'>
                  <LogIn className='h-4 w-4 mr-2' />
                  {t('Sign In')}
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
