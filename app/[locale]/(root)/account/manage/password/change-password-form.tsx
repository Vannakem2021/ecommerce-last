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
import { changePassword } from '@/lib/actions/user.actions'
import { Progress } from '@/components/ui/progress'

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ChangePasswordForm = z.infer<typeof ChangePasswordSchema>

export default function ChangePasswordForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassword = form.watch('newPassword')

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

  const passwordStrength = getPasswordStrength(newPassword || '')

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

  async function onSubmit(values: ChangePasswordForm) {
    const result = await changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
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
    
    form.reset()
    router.push('/account/manage')
  }

  return (
    <Card>
      <CardContent className='p-6'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Current Password */}
            <FormField
              control={form.control}
              name='currentPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder='Enter your current password'
                        {...field}
                      />
                      <button
                        type='button'
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
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

            {/* New Password */}
            <FormField
              control={form.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder='Enter your new password'
                        {...field}
                      />
                      <button
                        type='button'
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className='w-4 h-4' />
                        ) : (
                          <Eye className='w-4 h-4' />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  
                  {/* Password Strength Meter */}
                  {newPassword && (
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
                    <div className={`flex items-center gap-1 ${newPassword?.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                      {newPassword?.length >= 8 ? <Check className='w-3 h-3' /> : <X className='w-3 h-3' />}
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword || '') ? 'text-green-600' : 'text-gray-500'}`}>
                      {/[A-Z]/.test(newPassword || '') ? <Check className='w-3 h-3' /> : <X className='w-3 h-3' />}
                      One uppercase letter
                    </div>
                    <div className={`flex items-center gap-1 ${/[a-z]/.test(newPassword || '') ? 'text-green-600' : 'text-gray-500'}`}>
                      {/[a-z]/.test(newPassword || '') ? <Check className='w-3 h-3' /> : <X className='w-3 h-3' />}
                      One lowercase letter
                    </div>
                    <div className={`flex items-center gap-1 ${/[0-9]/.test(newPassword || '') ? 'text-green-600' : 'text-gray-500'}`}>
                      {/[0-9]/.test(newPassword || '') ? <Check className='w-3 h-3' /> : <X className='w-3 h-3' />}
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
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder='Confirm your new password'
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

            {/* Security Notice */}
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <h4 className='font-medium text-sm text-blue-900 mb-1'>
                🔒 Security Notice
              </h4>
              <p className='text-xs text-blue-700'>
                After changing your password, you'll remain logged in on this device. 
                For security, we recommend logging out of other devices.
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
                {form.formState.isSubmitting ? 'Changing Password...' : 'Change Password'}
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
