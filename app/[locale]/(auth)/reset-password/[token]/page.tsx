import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ResetPasswordForm from './reset-password-form'
import { validateResetToken } from '@/lib/actions/user.actions'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set your new password',
}

interface ResetPasswordPageProps {
  params: {
    token: string
  }
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = params

  // Validate the token before showing the form
  const tokenValidation = await validateResetToken(token)
  
  if (!tokenValidation.success) {
    notFound()
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <p className="text-muted-foreground">
            Enter your new password below.
          </p>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm token={token} />
        </CardContent>
      </Card>
    </div>
  )
}
