import { Metadata } from 'next'
import { redirect } from 'next/navigation'

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

  const { callbackUrl } = searchParams

  const session = await auth()
  if (session) {
    return redirect(callbackUrl || '/')
  }

  return (
    <div className='w-full'>
      <Card className='border-border/50 shadow-sm'>
        <CardHeader className='space-y-1 pb-4'>
          <CardTitle className='text-2xl font-semibold text-center'>Create Account</CardTitle>
          <p className='text-sm text-muted-foreground text-center'>
            Join ElectroHub to start shopping with us
          </p>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  )
}
