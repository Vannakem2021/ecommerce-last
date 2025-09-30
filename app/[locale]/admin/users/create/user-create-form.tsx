'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { createUserByAdmin } from '@/lib/actions/user.actions'
import { AdminUserCreateSchema } from '@/lib/validator'
import { getAssignableRoles } from '@/lib/rbac-utils'
import { UserRole } from '@/lib/constants'
import { UserIcon, ShieldIcon, MailIcon, KeyIcon, CrownIcon, UserCogIcon, UsersIcon } from 'lucide-react'

interface UserCreateFormProps {
  currentUserRole: string
}

const UserCreateForm = ({ currentUserRole }: UserCreateFormProps) => {
  const router = useRouter()
  const { toast } = useToast()

  // Get roles that current user can assign (excluding 'user' role for admin creation)
  const allAssignableRoles = getAssignableRoles(currentUserRole)
  const assignableRoles = allAssignableRoles.filter(role => role !== 'user')

  const form = useForm<z.infer<typeof AdminUserCreateSchema>>({
    resolver: zodResolver(AdminUserCreateSchema),
    defaultValues: {
      name: '',
      email: '',
      role: assignableRoles[0] || 'seller', // Default to first available role or seller
      password: '',
      sendWelcomeEmail: true, // Default to true for system users
    },
  })

  // Watch the selected role to show/hide relevant fields
  const selectedRole = form.watch('role')
  const isAdminRole = selectedRole === 'admin'
  const isManagerRole = selectedRole === 'manager'
  const isSellerRole = selectedRole === 'seller'

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <CrownIcon className="h-4 w-4 text-red-600" />
      case 'manager':
        return <UserCogIcon className="h-4 w-4 text-amber-600" />
      case 'seller':
        return <UsersIcon className="h-4 w-4 text-emerald-600" />
      default:
        return <UserIcon className="h-4 w-4 text-blue-600" />
    }
  }

  async function onSubmit(values: z.infer<typeof AdminUserCreateSchema>) {
    try {
      const res = await createUserByAdmin(values)
      
      if (!res.success) {
        return toast({
          variant: 'destructive',
          description: res.message,
        })
      }

      toast({
        description: res.message,
      })
      
      form.reset()
      router.push('/admin/users')
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.message,
      })
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form
          method='post'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
        >
          {/* Basic Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                </div>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Full Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter full name (e.g., John Doe)'
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        User's display name for the system
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email Address *</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='Enter email address'
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Used for login and notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Authentication Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-green-50 dark:bg-green-950">
                  <KeyIcon className="h-4 w-4 text-green-600" />
                </div>
                Authentication & Access
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Password *</FormLabel>
                      <FormControl>
                        <Input
                          type='password'
                          placeholder=''
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='role'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">User Role *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder='Select user role' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assignableRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              <div className="flex items-center gap-2">
                                {getRoleIcon(role)}
                                <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {selectedRole === 'seller' && 'Can manage products, inventory, and view orders'}
                        {selectedRole === 'manager' && 'Can manage products, orders, and view analytics'}
                        {selectedRole === 'admin' && 'Full system access with all administrative privileges'}
                        {!['seller', 'manager', 'admin'].includes(selectedRole) && 'Select a role to see permissions'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950">
                  <MailIcon className="h-4 w-4 text-amber-600" />
                </div>
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <FormField
                control={form.control}
                name='sendWelcomeEmail'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">Send Welcome Email</FormLabel>
                      <FormDescription>
                        Send welcome email with login credentials and system access information
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Role-specific security notices */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4">
                <div className="flex items-start gap-3">
                  <ShieldIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      System User Access
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      {isAdminRole && 'This user will have full administrative access. Ensure proper security protocols are followed.'}
                      {isManagerRole && 'This user will have management-level access to products, orders, and analytics.'}
                      {isSellerRole && 'This user will have access to product and inventory management features.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className='flex items-center justify-between'>
                <div className="text-sm text-muted-foreground">
                  {form.formState.isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Creating user account...
                    </span>
                  ) : (
                    'Review all information before creating the user account'
                  )}
                </div>
                <div className='flex items-center gap-3'>
                  <Button
                    variant='outline'
                    type='button'
                    onClick={() => router.push('/admin/users')}
                    disabled={form.formState.isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={form.formState.isSubmitting}
                    className="min-w-[140px]"
                  >
                    {form.formState.isSubmitting ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}

export default UserCreateForm
