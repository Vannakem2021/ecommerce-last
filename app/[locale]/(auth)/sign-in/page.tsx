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
    <div className='w-full space-y-6'>
      <Card className='border-border/50 shadow-sm'>
        <CardHeader className='space-y-1 pb-4'>
          <CardTitle className='text-2xl font-semibold text-center'>Sign In</CardTitle>
          <p className='text-sm text-muted-foreground text-center'>
            Enter your credentials to access your account
          </p>
        </CardHeader>
        <CardContent className='space-y-4'>
          <CredentialsSignInForm />
          <SeparatorWithOr />
          <GoogleSignInForm />
        </CardContent>
      </Card>

      <div className='text-center'>
        <p className='text-sm text-muted-foreground mb-3'>
          New to {site.name}?
        </p>
        <Link href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
          <Button className='w-full' variant='outline'>
            Create your {site.name} account
          </Button>
        </Link>
      </div>
    </div>
  )
}
