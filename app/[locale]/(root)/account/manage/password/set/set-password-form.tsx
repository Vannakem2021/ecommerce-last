'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { setPassword } from '@/lib/actions/user.actions'

const SetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SetPasswordForm = z.infer<typeof SetPasswordSchema>

export default function SetPasswordForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<SetPasswordForm>({
    resolver: zodResolver(SetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const password = form.watch('password')

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (password.length >= 12) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    return Math.min(strength, 100)
  }

  const passwordStrength = getPasswordStrength(password || '')

  const getStrengthColor = (strength: number) => {
    if (strength < 50) return 'bg-red-500'
    if (strength < 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = (strength: number) => {
    if (strength < 50) return 'Weak'
    if (strength < 75) return 'Medium'
    return 'Strong'
  }

  async function onSubmit(values: SetPasswordForm) {
    const result = await setPassword({
      password: values.password,
    })

    if (!result.success) {
      toast({
        variant: 'destructive',
        description: result.message,
      })
      return
    }

    toast({
      description: result.message,
    })
    
    router.push('/account/manage')
  }

  return (
    <Card>
      <CardContent className='p-6'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Password */}
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Create a strong password'
                        {...field}
                      />
                      <button
                        type='button'
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className='w-4 h-4' />
                        ) : (
                          <Eye className='w-4 h-4' />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  
                  {/* Password Strength Meter */}
                  {password && (
                    <div className='mt-2 space-y-2'>
                      <div className='flex items-center justify-between text-xs'>
                        <span>Password strength:</span>
                        <span className='font-medium'>{getStrengthText(passwordStrength)}</span>
                      </div>
                      <div className='w-full h-2 bg-gray-200 rounded-full overflow-hidden'>
                        <div 
                          className={`h-full transition-all ${getStrengthColor(passwordStrength)}`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Password Requirements */}
                  <div className='text-xs space-y-1 mt-2 text-muted-foreground'>
                    <div className={`flex items-center gap-1 ${password?.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                      {password?.length >= 8 ? <Check className='w-3 h-3' /> : <X className='w-3 h-3' />}
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-1 ${/[A-Z]/.test(password || '') ? 'text-green-600' : 'text-gray-500'}`}>
                      {/[A-Z]/.test(password || '') ? <Check className='w-3 h-3' /> : <X className='w-3 h-3' />}
                      One uppercase letter
                    </div>
                    <div className={`flex items-center gap-1 ${/[a-z]/.test(password || '') ? 'text-green-600' : 'text-gray-500'}`}>
                      {/[a-z]/.test(password || '') ? <Check className='w-3 h-3' /> : <X className='w-3 h-3' />}
                      One lowercase letter
                    </div>
                    <div className={`flex items-center gap-1 ${/[0-9]/.test(password || '') ? 'text-green-600' : 'text-gray-500'}`}>
                      {/[0-9]/.test(password || '') ? <Check className='w-3 h-3' /> : <X className='w-3 h-3' />}
                      One number
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder='Confirm your password'
                        {...field}
                      />
                      <button
                        type='button'
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className='w-4 h-4' />
                        ) : (
                          <Eye className='w-4 h-4' />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Info Notice */}
            <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
              <h4 className='font-medium text-sm text-green-900 mb-1'>
                ✅ What happens next?
              </h4>
              <p className='text-xs text-green-700'>
                After setting your password, you'll be able to sign in using either your email/password 
                OR your Google account. Both methods will work!
              </p>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3'>
              <Button
                type='submit'
                size='lg'
                disabled={form.formState.isSubmitting}
                className='flex-1'
              >
                {form.formState.isSubmitting ? 'Setting Password...' : 'Set Password'}
              </Button>
              <Button
                type='button'
                variant='outline'
                size='lg'
                onClick={() => router.push('/account/manage')}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
