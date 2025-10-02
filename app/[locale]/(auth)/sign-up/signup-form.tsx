'use client'
import { redirect } from 'next/navigation'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
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
import { IUserSignUp } from '@/types'
import { registerUser, signInWithCredentials } from '@/lib/actions/user.actions'
import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSignUpSchema } from '@/lib/validator'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { createSecureFormDefaults, validateFormDefaults, getSecurePlaceholder } from '@/lib/utils/form-security'
import { signIn } from 'next-auth/react'
import { useFormStatus } from 'react-dom'
import { useLocale } from 'next-intl'

const signUpDefaultValues = createSecureFormDefaults({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

function GoogleSignUpButtons({ callbackUrl }: { callbackUrl: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const locale = useLocale()

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      const safeCallbackUrl = callbackUrl.startsWith('/') ? callbackUrl : '/'
      let currentLocale = locale
      try {
        if (!currentLocale || typeof currentLocale !== 'string') {
          currentLocale = 'en-US'
        }
      } catch (localeError) {
        console.warn('Failed to detect locale, using default:', localeError)
        currentLocale = 'en-US'
      }
      const localeAwareCallbackUrl = `/${currentLocale}/auth/post-signin?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`
      await signIn('google', {
        callbackUrl: localeAwareCallbackUrl,
        redirect: true,
      })
    } catch (error) {
      setIsLoading(false)
      console.error('Google sign-in error:', error)
    }
  }

  const SignInButton = () => {
    const { pending } = useFormStatus()
    const loading = pending || isLoading

    return (
      <Button
        disabled={loading}
        className='w-full h-9 sm:h-14 text-sm sm:text-lg'
        variant='outline'
        onClick={handleGoogleSignIn}
        type="button"
      >
        {loading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 sm:h-6 sm:w-6 animate-spin' />
            Redirecting...
          </>
        ) : (
          <>
            <svg className='mr-1 sm:mr-3 h-5 w-5 sm:h-7 sm:w-7' viewBox='0 0 24 24'>
              <path
                fill='currentColor'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='currentColor'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='currentColor'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              />
              <path
                fill='currentColor'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              />
            </svg>
            Continue with Google
          </>
        )}
      </Button>
    )
  }

  return (
    <div className='space-y-2 sm:space-y-3'>
      <SignInButton />
      <Button
        disabled={isLoading}
        className='w-full h-9 sm:h-14 text-sm sm:text-lg'
        variant='outline'
        type="button"
      >
        <svg className='mr-1 sm:mr-3 h-5 w-5 sm:h-7 sm:w-7' fill='#1877F2' viewBox='0 0 24 24'>
          <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/>
        </svg>
        Continue with Facebook
      </Button>
    </div>
  )
}

export default function SignUpForm({ callbackUrl = '/' }: { callbackUrl?: string }) {
  const {
    setting: { site },
  } = useSettingStore()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Validate form defaults for security
  validateFormDefaults(signUpDefaultValues, 'signup')

  const form = useForm<IUserSignUp>({
    resolver: zodResolver(UserSignUpSchema),
    defaultValues: signUpDefaultValues,
  })

  const { control, handleSubmit } = form

  const onSubmit = async (data: IUserSignUp) => {
    setIsLoading(true)
    try {
      const res = await registerUser(data)
      console.log('Registration response:', res)
      if (!res.success) {
        setIsLoading(false)
        toast({
          title: 'Error',
          description: res.error,
          variant: 'destructive',
        })
        return
      }

      // New flow: redirect to email verification
      const typedRes = res as any;
      console.log('Checking verification flow:', {
        hasRequiresVerification: 'requiresVerification' in res,
        requiresVerification: typedRes.requiresVerification,
        hasUserId: 'userId' in res,
        userId: typedRes.userId,
        bothExist: typedRes.requiresVerification && typedRes.userId
      })
      
      if (typedRes.requiresVerification && typedRes.userId) {
        console.log('✅ Taking verification path')
        console.log('Redirecting to:', `/verify-email?userId=${typedRes.userId}&email=${encodeURIComponent(data.email)}`)
        setIsLoading(false)
        toast({
          title: 'Account Created',
          description: 'Please check your email to verify your account.',
        })
        
        // Redirect to verification page with userId and email
        const verifyUrl = `/verify-email?userId=${typedRes.userId}&email=${encodeURIComponent(data.email)}`
        console.log('Calling router.push with:', verifyUrl)
        
        try {
          router.push(verifyUrl)
          console.log('Router.push called successfully')
        } catch (routerError) {
          console.error('Router.push threw error:', routerError)
          throw routerError
        }
        
        console.log('Returning from onSubmit after successful redirect')
        return
      }

      // Fallback: old behavior if verification not required (shouldn't happen)
      console.log('❌ Taking fallback path - attempting auto sign-in')
      console.log('This should NOT happen! Response was:', res)
      await signInWithCredentials({
        email: data.email,
        password: data.password,
      })
      redirect(callbackUrl)
    } catch (error) {
      console.error('❌ Caught error in onSubmit:', error)
      console.error('Error type:', error?.constructor?.name)
      console.error('Error message:', (error as Error)?.message)
      
      setIsLoading(false)
      
      if (isRedirectError(error)) {
        console.log('This is a redirect error, re-throwing')
        throw error
      }
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Invalid email or password',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input type='hidden' name='callbackUrl' value={callbackUrl} />
          <div className='space-y-2 sm:space-y-4'>
            <FormField
              control={control}
              name='name'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-sm sm:text-lg font-medium'>Name</FormLabel>
                  <FormControl>
                    <Input placeholder={getSecurePlaceholder('name')} className='h-10 sm:h-14 text-sm sm:text-lg' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name='email'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-sm sm:text-lg font-medium'>Email</FormLabel>
                  <FormControl>
                    <Input placeholder={getSecurePlaceholder('email')} className='h-10 sm:h-14 text-sm sm:text-lg' {...field} />
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
                  <FormLabel className='text-sm sm:text-lg font-medium'>Password</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder={getSecurePlaceholder('password')}
                      className='h-10 sm:h-14 text-sm sm:text-lg'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel className='text-sm sm:text-lg font-medium'>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder={getSecurePlaceholder('password')}
                      className='h-10 sm:h-14 text-sm sm:text-lg'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <Button type='submit' disabled={isLoading} className='w-full h-10 sm:h-14 text-base sm:text-xl font-semibold'>
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 sm:h-6 sm:w-6 animate-spin' />
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>
            </div>

            <div className='text-[10px] sm:text-sm text-muted-foreground text-center leading-tight'>
              By creating an account, you agree to {site.name}&apos;s{' '}
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

      <div className='relative my-1 sm:my-0'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t' />
        </div>
        <div className='relative flex justify-center text-[10px] sm:text-base uppercase'>
          <span className='bg-background px-2 sm:px-4 text-muted-foreground'>Or create an account using:</span>
        </div>
      </div>

      <GoogleSignUpButtons callbackUrl={callbackUrl} />
    </>
  )
}
