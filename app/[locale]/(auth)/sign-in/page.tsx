import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import SeparatorWithOr from '@/components/shared/separator-or'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import CredentialsSignInForm from './credentials-signin-form'
import { GoogleSignInForm } from './google-signin-form'
import { Button } from '@/components/ui/button'
import { getSetting } from '@/lib/actions/setting.actions'
import { getRoleBasedRedirectUrl } from '@/lib/auth-redirect'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default async function SignInPage(props: {
  searchParams: Promise<{
    callbackUrl: string
  }>
}) {
  const searchParams = await props.searchParams
  const { site } = await getSetting()

  const { callbackUrl = '/' } = searchParams

  const session = await auth()
  if (session) {
    // Use role-based redirect if user is already authenticated
    const redirectUrl = getRoleBasedRedirectUrl(session.user.role, callbackUrl)
    return redirect(redirectUrl)
  }

  return (
    <div className='w-full max-w-2xl mx-auto px-4 sm:px-6'>
      <Card className='border shadow-lg'>
        <CardHeader className='space-y-2 pb-4 sm:pb-6 px-6 sm:px-12 pt-4 sm:pt-6'>
          <CardTitle className='text-3xl sm:text-4xl md:text-5xl font-bold text-center'>Sign In</CardTitle>
          <p className='text-sm sm:text-base md:text-lg text-center text-muted-foreground'>
            New to Our Product?{' '}
            <Link href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`} className='text-primary hover:underline font-medium'>
              Create an Account
            </Link>
          </p>
        </CardHeader>
        <CardContent className='space-y-4 sm:space-y-5 px-6 sm:px-12 pb-4 sm:pb-6'>
          <CredentialsSignInForm />

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-sm sm:text-base uppercase'>
              <span className='bg-background px-3 sm:px-4 text-muted-foreground'>Or sign in using:</span>
            </div>
          </div>

          <GoogleSignInForm />
        </CardContent>
      </Card>
    </div>
  )
}
