import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import VerifyEmailForm from './verify-email-form'
import { checkEmailVerificationStatus } from '@/lib/actions/email-verification.actions'

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address',
}

interface VerifyEmailPageProps {
  searchParams: Promise<{
    userId?: string
    email?: string
  }>
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams
  const { userId, email } = params

  // Validate params
  if (!userId || !email) {
    redirect('/sign-up')
  }

  // Check verification status
  const status = await checkEmailVerificationStatus(userId)

  if (status.verified) {
    // Already verified, redirect to sign-in
    redirect('/sign-in?message=already-verified')
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Verify Your Email</CardTitle>
          <p className="text-muted-foreground text-center">
            We sent a 6-digit code to
          </p>
          <p className="text-center font-semibold">{decodeURIComponent(email)}</p>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <VerifyEmailForm userId={userId} userEmail={decodeURIComponent(email)} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
