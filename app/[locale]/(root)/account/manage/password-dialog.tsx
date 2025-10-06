'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { changePassword, setPassword } from '@/lib/actions/user.actions'

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Need 1 uppercase')
    .regex(/[a-z]/, 'Need 1 lowercase')
    .regex(/[0-9]/, 'Need 1 number'),
  confirmPassword: z.string().min(1, 'Please confirm'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

const SetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Need 1 uppercase')
    .regex(/[a-z]/, 'Need 1 lowercase')
    .regex(/[0-9]/, 'Need 1 number'),
  confirmPassword: z.string().min(1, 'Please confirm'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

interface PasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hasPassword: boolean
}

export function PasswordDialog({ open, onOpenChange, hasPassword }: PasswordDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<z.infer<typeof ChangePasswordSchema | typeof SetPasswordSchema>>({
    resolver: zodResolver(hasPassword ? ChangePasswordSchema : SetPasswordSchema),
    defaultValues: hasPassword ? {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    } : {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassword = form.watch('newPassword')

  // Password strength
  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (password.length >= 12) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    return Math.min(strength, 100)
  }

  const strength = getPasswordStrength(newPassword || '')

  const getStrengthColor = (s: number) => {
    if (s < 50) return 'bg-muted-foreground/30'
    if (s < 75) return 'bg-primary/50'
    return 'bg-primary'
  }

  const getStrengthText = (s: number) => {
    if (s < 50) return 'Weak'
    if (s < 75) return 'Medium'
    return 'Strong'
  }

  async function onSubmit(values: any) {
    const result = hasPassword 
      ? await changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
      : await setPassword({ password: values.newPassword })

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
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{hasPassword ? 'Change' : 'Set'} Password</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {hasPassword && (
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showCurrent ? 'text' : 'password'}
                          placeholder="Enter current password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setShowCurrent(!showCurrent)}
                        >
                          {showCurrent ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNew ? 'text' : 'password'}
                        placeholder="Enter new password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowNew(!showNew)}
                      >
                        {showNew ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  
                  {field.value && (
                    <div className="space-y-1">
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${getStrengthColor(strength)}`}
                          style={{ width: `${strength}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getStrengthText(strength)} • Min 8 chars, 1 uppercase, 1 number
                      </p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  onOpenChange(false)
                }}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting 
                  ? 'Saving...' 
                  : hasPassword ? 'Change' : 'Set Password'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
