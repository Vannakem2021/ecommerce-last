'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import OTPInput from '@/components/auth/otp-input'
import { verifyEmailOTP, resendEmailOTP } from '@/lib/actions/email-verification.actions'
import { toast } from '@/hooks/use-toast'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface VerifyEmailFormProps {
  userId: string
  userEmail: string
}

export default function VerifyEmailForm({ userId, userEmail }: VerifyEmailFormProps) {
  const [otp, setOtp] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [expiresIn, setExpiresIn] = useState(10 * 60) // 10 minutes in seconds
  const router = useRouter()

  // Expiration countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 0) {
          clearInterval(interval)
          setError('Code expired. Please request a new one.')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handle OTP verification
  const handleVerify = async (otpValue: string) => {
    if (otpValue.length !== 6) return

    setIsVerifying(true)
    setError('')

    try {
      const result = await verifyEmailOTP(userId, otpValue)

      if (result.success) {
        setSuccess(true)
        toast({
          title: 'Email Verified!',
          description: 'Your email has been verified successfully. Redirecting to sign in...',
        })

        // Redirect to sign-in after 2 seconds
        setTimeout(() => {
          router.push(`/sign-in?verified=true&email=${encodeURIComponent(userEmail)}`)
        }, 2000)
      } else {
        setError(result.error || 'Invalid code')
        setOtp('') // Clear input on error
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setOtp('')
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle resend
  const handleResend = async () => {
    if (resendCooldown > 0) return

    setIsResending(true)
    setError('')

    try {
      const result = await resendEmailOTP(userId)

      if (result.success) {
        toast({
          title: 'Code Sent',
          description: 'A new verification code has been sent to your email.',
        })
        setResendCooldown(60)
        setExpiresIn(10 * 60) // Reset expiration
        setOtp('') // Clear input
      } else if (result.cooldownRemaining) {
        setResendCooldown(result.cooldownRemaining)
        toast({
          title: 'Please Wait',
          description: `You can request a new code in ${result.cooldownRemaining} seconds.`,
          variant: 'destructive',
        })
      } else {
        setError(result.error || 'Failed to resend code')
      }
    } catch (err) {
      setError('Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  // Handle OTP change
  const handleOtpChange = (value: string) => {
    setOtp(value)
    setError('') // Clear error when user starts typing
  }

  // Handle OTP complete (all 6 digits entered)
  const handleOtpComplete = (value: string) => {
    handleVerify(value)
  }

  // Show success state
  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-green-600 mb-2">Email Verified!</h3>
          <p className="text-muted-foreground">Redirecting you to sign in...</p>
        </div>
        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* OTP Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-center block">
          Enter Verification Code
        </label>
        <OTPInput
          value={otp}
          onChange={handleOtpChange}
          onComplete={handleOtpComplete}
          error={!!error}
          disabled={isVerifying || success}
          autoFocus
        />
      </div>

      {/* Expiration Timer */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Code expires in{' '}
          <span
            className={`font-semibold ${
              expiresIn < 60 ? 'text-red-500' : 'text-foreground'
            }`}
          >
            {formatTime(expiresIn)}
          </span>
        </p>
      </div>

      {/* Verify Button */}
      <Button
        onClick={() => handleVerify(otp)}
        className="w-full"
        disabled={otp.length !== 6 || isVerifying}
      >
        {isVerifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify Email'
        )}
      </Button>

      {/* Resend Section */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">Didn&apos;t receive the code?</p>
        <Button
          variant="link"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending}
          className="text-primary"
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : resendCooldown > 0 ? (
            `Resend code in ${resendCooldown}s`
          ) : (
            'Resend Code'
          )}
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-center pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Check your spam folder if you don&apos;t see the email.
        </p>
      </div>
    </div>
  )
}
