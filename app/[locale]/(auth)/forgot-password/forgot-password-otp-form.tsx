'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ForgotPasswordSchema } from '@/lib/validator'
import { generatePasswordResetOTP, verifyPasswordResetOTP, resendPasswordResetOTP } from '@/lib/actions/password-reset-otp.actions'
import { IForgotPassword } from '@/types'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

// Schema for OTP and password verification
const ResetPasswordOTPSchema = z.object({
  otp: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must contain only numbers'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordOTPInput = z.infer<typeof ResetPasswordOTPSchema>

export default function ForgotPasswordOTPForm() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'verify'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [cooldown, setCooldown] = useState(0)
  const [redirectCountdown, setRedirectCountdown] = useState(3)

  // Email form
  const emailForm = useForm<IForgotPassword>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  // OTP + Password form
  const otpForm = useForm<ResetPasswordOTPInput>({
    resolver: zodResolver(ResetPasswordOTPSchema),
    defaultValues: {
      otp: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onEmailSubmit = async (data: IForgotPassword) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const result = await generatePasswordResetOTP(data.email)
      
      if (result.success && result.userId) {
        setUserId(result.userId)
        setUserEmail(data.email)
        setStep('verify')
        setMessage({ type: 'success', text: 'Verification code sent to your email!' })
        setCooldown(60) // 60 second cooldown
        
        // Start cooldown timer
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setMessage({ type: 'success', text: result.message || 'If an account exists, a verification code has been sent.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const onOTPSubmit = async (data: ResetPasswordOTPInput) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const result = await verifyPasswordResetOTP(userId, data.otp, data.password)
      
      if (result.success) {
        setIsLoading(false)
        setIsRedirecting(true)
        setMessage({ type: 'success', text: result.message || 'Password reset successfully!' })
        
        // Start countdown
        setRedirectCountdown(3)
        const countdownInterval = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push('/sign-in?message=password-reset-success')
        }, 3000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Invalid or expired code' })
        setIsLoading(false)
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsResending(true)
    setMessage(null)

    try {
      const result = await resendPasswordResetOTP(userId)
      
      if (result.success) {
        setMessage({ type: 'success', text: 'New verification code sent!' })
        setCooldown(60) // Reset cooldown
        
        // Start cooldown timer
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to resend code' })
        if (result.cooldownRemaining) {
          setCooldown(result.cooldownRemaining)
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setIsResending(false)
    }
  }

  // Step 1: Email input
  if (step === 'email') {
    return (
      <Form {...emailForm}>
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4 md:space-y-6">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="text-xs md:text-sm">
              <AlertDescription>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <FormField
            control={emailForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm md:text-base">Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    className="h-10 md:h-11 text-sm md:text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs md:text-sm" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-10 md:h-11 text-sm md:text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                Sending code...
              </>
            ) : (
              'Send Verification Code'
            )}
          </Button>

          <div className="text-center space-y-1.5 md:space-y-2 pt-2">
            <p className="text-xs md:text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link href="/sign-in" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/sign-up" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </Form>
    )
  }

  // Step 2: OTP + New Password input
  return (
    <Form {...otpForm}>
      <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4 md:space-y-6">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="text-xs md:text-sm">
            <AlertDescription className="flex items-center justify-between">
              <span>{message.text}</span>
              {isRedirecting && (
                <span className="flex items-center gap-2 ml-2">
                  <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  <span className="text-xs md:text-sm">Redirecting in {redirectCountdown}s...</span>
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center space-y-1 md:space-y-2 pb-2 md:pb-4">
          <p className="text-xs md:text-sm text-muted-foreground">
            We sent a 6-digit code to
          </p>
          <p className="font-semibold text-sm md:text-base break-all px-2">{userEmail}</p>
        </div>

        <FormField
          control={otpForm.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm md:text-base">Verification Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  className="text-center text-xl md:text-2xl lg:text-3xl tracking-[0.5em] md:tracking-widest font-mono h-12 md:h-14"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs md:text-sm" />
              <p className="text-xs md:text-sm text-muted-foreground text-center mt-2">
                Code expires in 15 minutes
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={otpForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm md:text-base">New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  className="h-10 md:h-11 text-sm md:text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs md:text-sm" />
            </FormItem>
          )}
        />

        <FormField
          control={otpForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm md:text-base">Confirm New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  className="h-10 md:h-11 text-sm md:text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs md:text-sm" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-10 md:h-11 text-sm md:text-base font-semibold"
          disabled={isLoading || isRedirecting}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
              Resetting password...
            </>
          ) : isRedirecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
              Success! Redirecting...
            </>
          ) : (
            'Reset Password'
          )}
        </Button>

        {!isRedirecting && (
          <div className="text-center space-y-1.5 md:space-y-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 md:h-9 text-xs md:text-sm"
              onClick={handleResendOTP}
              disabled={isResending || cooldown > 0 || isLoading}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Resending...
                </>
              ) : cooldown > 0 ? (
                `Resend code in ${cooldown}s`
              ) : (
                'Resend code'
              )}
            </Button>
            
            <p className="text-xs md:text-sm text-muted-foreground">
              <Button
                type="button"
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs md:text-sm"
                onClick={() => setStep('email')}
                disabled={isLoading}
              >
                Use a different email
              </Button>
            </p>
          </div>
        )}
      </form>
    </Form>
  )
}
