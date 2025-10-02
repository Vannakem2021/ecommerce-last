'use client'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import useSettingStore from '@/hooks/use-setting-store'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { IUserSignIn } from '@/types'

import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSignInSchema } from '@/lib/validator'
import { getRoleBasedRedirectUrl } from '@/lib/auth-redirect'

const signInDefaultValues = {
  email: '',
  password: '',
}

export default function CredentialsSignInForm() {
  const {
    setting: { site },
  } = useSettingStore()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<IUserSignIn>({
    resolver: zodResolver(UserSignInSchema),
    defaultValues: signInDefaultValues,
  })

  const { control, handleSubmit } = form

  // Show success message if coming from email verification
  useEffect(() => {
    const verified = searchParams.get('verified')
    if (verified === 'true') {
      toast({
        title: 'Email Verified!',
        description: 'Your email has been verified successfully. You can now sign in.',
      })
    }
  }, [searchParams])

  const onSubmit = async (data: IUserSignIn) => {
    setIsLoading(true)
    try {
      // Use NextAuth's signIn with manual redirect handling
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false, // Handle redirect manually for role-based routing
      })

      if (result?.error) {
        setIsLoading(false)
        let errorMessage = 'Invalid email or password'

        // Provide more specific error messages
        if (result.error === 'CredentialsSignin') {
          errorMessage = 'Invalid email or password'
        } else if (result.error === 'AccessDenied') {
          errorMessage = 'Account access denied'
        } else if (result.error === 'Configuration') {
          errorMessage = 'Authentication configuration error'
        }

        toast({
          title: 'Sign In Failed',
          description: errorMessage,
          variant: 'destructive',
        })
      } else if (result?.ok) {
        // Authentication successful - handle role-based redirect
        try {
          // Get the updated session to access user role
          const response = await fetch('/api/auth/session')
          const session = await response.json()

          if (session?.user?.role) {
            // Validate callback URL to prevent open redirect attacks
            const safeCallbackUrl = callbackUrl.startsWith('/') ? callbackUrl : null

            // Get role-based redirect URL
            const redirectUrl = getRoleBasedRedirectUrl(session.user.role, safeCallbackUrl)

            // Redirect to appropriate page
            router.replace(redirectUrl)
          } else {
            // Fallback redirect if role is not available
            router.replace('/')
          }
        } catch (sessionError) {
          console.error('Error getting session after login:', sessionError)
          // Fallback redirect
          router.replace('/')
        }
      }
    } catch {
      setIsLoading(false)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type='hidden' name='callbackUrl' value={callbackUrl} />
        <div className='space-y-2 md:space-y-3 lg:space-y-4'>
          <FormField
            control={control}
            name='email'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='text-xs md:text-sm lg:text-base font-medium'>Email</FormLabel>
                <FormControl>
                  <Input placeholder='Enter email address' className='h-9 md:h-10 lg:h-12 text-sm md:text-base' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='password'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='text-xs md:text-sm lg:text-base font-medium'>Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Enter password'
                    className='h-9 md:h-10 lg:h-12 text-sm md:text-base'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex items-center space-x-2'>
            <input
              type='checkbox'
              id='keepSignedIn'
              className='h-4 w-4 rounded border-gray-300'
            />
            <label htmlFor='keepSignedIn' className='text-xs md:text-sm lg:text-base text-muted-foreground cursor-pointer'>
              Keep me signed in
            </label>
          </div>

          <div>
            <Button type='submit' disabled={isLoading} className='w-full h-9 md:h-10 lg:h-12 text-sm md:text-base lg:text-lg font-semibold'>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin' />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </div>

          <div className='text-center'>
            <Link
              href='/forgot-password'
              className='text-xs md:text-sm lg:text-base text-primary hover:underline'
            >
              Forgot Your Password?
            </Link>
          </div>
        </div>
      </form>
    </Form>
  )
}
