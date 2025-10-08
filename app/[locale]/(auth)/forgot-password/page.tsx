import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ForgotPasswordOTPForm from './forgot-password-otp-form'

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your password',
}

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-0">
      <Card className="border-0 sm:border shadow-none sm:shadow-sm">
        <CardHeader className="space-y-1 px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl">Reset Password</CardTitle>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            Enter your email address and we&apos;ll send you a verification code to reset your password.
          </p>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <ForgotPasswordOTPForm />
        </CardContent>
      </Card>
    </div>
  )
}
