import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { auth } from '@/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import SignUpForm from './signup-form'

export const metadata: Metadata = {
  title: 'Sign Up',
}

export default async function SignUpPage(props: {
  searchParams: Promise<{
    callbackUrl: string
  }>
}) {
  const searchParams = await props.searchParams

  const { callbackUrl = '/' } = searchParams

  const session = await auth()
  if (session) {
    return redirect(callbackUrl || '/')
  }

  return (
    <div className='w-full max-w-2xl mx-auto px-4 sm:px-6'>
      <Card className='border shadow-lg'>
        <CardHeader className='space-y-1 sm:space-y-2 pb-2 md:pb-4 lg:pb-6 px-4 md:px-8 lg:px-12 pt-3 md:pt-4 lg:pt-6'>
          <CardTitle className='text-xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-center'>Create New Account</CardTitle>
          <p className='text-xs md:text-sm lg:text-base xl:text-lg text-center text-muted-foreground'>
            Have an account?{' '}
            <Link href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`} className='text-primary hover:underline font-medium'>
              Sign In
            </Link>
          </p>
        </CardHeader>
        <CardContent className='space-y-2 md:space-y-3 lg:space-y-5 px-4 md:px-8 lg:px-12 pb-3 md:pb-4 lg:pb-6'>
          <SignUpForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </div>
  )
}
