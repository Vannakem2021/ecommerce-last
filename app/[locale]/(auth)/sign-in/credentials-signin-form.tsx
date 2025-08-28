'use client'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
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
      // Use NextAuth's signIn directly from the client
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      
      if (result?.error) {
        throw new Error(result.error)
      }
      
      if (result?.ok) {
        // Force session update to get the latest user data
        const session = await update()
        
        // Small delay to ensure session is fully updated
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Get the updated session one more time if needed
        const finalSession = session?.user?.role ? session : await update()
        
        // Determine redirect URL based on role
        if (finalSession?.user?.role) {
          const redirectUrl = getRoleBasedRedirectUrl(finalSession.user.role, callbackUrl)
          router.push(redirectUrl)
        } else {
          // Fallback to callback URL if no role available yet
          router.push(callbackUrl)
        }
        // Don't reset loading here - let the navigation happen
      }
    } catch {
      setIsLoading(false)
      toast({
        title: 'Error',
        description: 'Invalid email or password',
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type='hidden' name='callbackUrl' value={callbackUrl} />
        <div className='space-y-6'>
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
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>

          <div className='text-center'>
            <Link
              href='/forgot-password'
              className='text-sm text-blue-600 hover:underline'
            >
              Forgot your password?
            </Link>
          </div>

          <div className='text-sm'>
            By signing in, you agree to {site.name}&apos;s{' '}
            <Link href='/page/conditions-of-use'>Conditions of Use</Link> and{' '}
            <Link href='/page/privacy-policy'>Privacy Notice.</Link>
          </div>
        </div>
      </form>
    </Form>
  )
}
