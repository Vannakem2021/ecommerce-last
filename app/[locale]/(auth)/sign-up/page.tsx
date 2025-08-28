import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPostLoginRedirectUrl } from '@/lib/auth-utils'

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
    // Use role-based redirect for existing sessions
    const redirectUrl = getPostLoginRedirectUrl(session.user.role, callbackUrl || '/')
    return redirect(redirectUrl)
  }

  return (
    <div className='w-full'>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  )
}
