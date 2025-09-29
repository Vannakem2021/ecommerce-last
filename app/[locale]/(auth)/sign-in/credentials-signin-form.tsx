'use client'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
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
  const { update } = useSession()
  const router = useRouter()

  const form = useForm<IUserSignIn>({
    resolver: zodResolver(UserSignInSchema),
    defaultValues: signInDefaultValues,
  })

  const { control, handleSubmit } = form

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
    } catch (error) {
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
        <div className='space-y-4'>
          <FormField
            control={control}
            name='email'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder='Enter email address' {...field} />
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Enter password'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <Button type='submit' disabled={isLoading} className='w-full'>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
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
              className='text-sm text-primary hover:underline'
            >
              Forgot your password?
            </Link>
          </div>

          <div className='text-xs text-muted-foreground text-center'>
            By signing in, you agree to {site.name}&apos;s{' '}
            <Link href='/page/conditions-of-use' className='text-primary hover:underline'>
              Conditions of Use
            </Link>{' '}
            and{' '}
            <Link href='/page/privacy-policy' className='text-primary hover:underline'>
              Privacy Notice.
            </Link>
          </div>
        </div>
      </form>
    </Form>
  )
}
