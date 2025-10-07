'use client'

import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
import { UserIcon, ShieldIcon, MailIcon, KeyIcon, CrownIcon, UserCogIcon, UsersIcon, Eye, EyeOff, Sparkles, CheckCircle, XCircle } from 'lucide-react'
import { PasswordStrength, getPasswordRequirements } from '@/components/ui/password-strength'
import { RolePermissionsDetail } from '@/components/shared/user/role-permissions-detail'
import { UserCreatedSuccessDialog } from '@/components/shared/user/user-created-success-dialog'

interface UserCreateFormProps {
  currentUserRole: string
}

const UserCreateForm = ({ currentUserRole }: UserCreateFormProps) => {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = React.useState(false)
  const [createdUser, setCreatedUser] = React.useState<{
    name: string
    email: string
    password: string
    id: string
    welcomeEmailSent: boolean
  } | null>(null)

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
      confirmPassword: '',
      sendWelcomeEmail: true, // Default to true for system users
    },
  })

  // Watch the selected role and password to show/hide relevant fields
  const selectedRole = form.watch('role')
  const password = form.watch('password')
  const confirmPassword = form.watch('confirmPassword')
  const isAdminRole = selectedRole === 'admin'
  const isManagerRole = selectedRole === 'manager'
  const isSellerRole = selectedRole === 'seller'
  
  // Password requirements
  const requirements = React.useMemo(() => getPasswordRequirements(password), [password])
  
  // Generate random password
  const generatePassword = () => {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let newPassword = ''
    
    // Ensure at least one of each type
    newPassword += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
    newPassword += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
    newPassword += '0123456789'[Math.floor(Math.random() * 10)]
    newPassword += '!@#$%^&*'[Math.floor(Math.random() * 8)]
    
    // Fill the rest
    for (let i = newPassword.length; i < length; i++) {
      newPassword += charset[Math.floor(Math.random() * charset.length)]
    }
    
    // Shuffle
    newPassword = newPassword.split('').sort(() => Math.random() - 0.5).join('')
    
    form.setValue('password', newPassword)
    form.setValue('confirmPassword', newPassword)
    setShowPassword(true)
    setShowConfirmPassword(true)
    
    toast({
      description: '✓ Secure password generated',
    })
  }

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
      
      console.log('Create user response:', res)
      console.log('Response data:', res.data)
      console.log('User ID:', res.data?.id)
      
      if (!res.success) {
        return toast({
          variant: 'destructive',
          description: res.message,
        })
      }

      // Validate that we have the user ID
      if (!res.data?.id) {
        console.error('Missing user ID in response:', res)
        return toast({
          variant: 'destructive',
          description: 'User created but ID not returned. Please refresh the page.',
        })
      }

      console.log('Setting created user with ID:', res.data.id)
      
      // Show success modal with credentials
      setCreatedUser({
        name: values.name,
        email: values.email,
        password: values.password,
        id: res.data.id,
        welcomeEmailSent: values.sendWelcomeEmail,
      })
      setSuccessDialogOpen(true)
      
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
                        User&apos;s display name for the system
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
              {/* Password Fields */}
              <div className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <FormField
                    control={form.control}
                    name='password'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Password *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder='Enter secure password'
                              className="h-10 pr-10"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-10 w-10 px-0"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        {password && (
                          <>
                            <PasswordStrength password={password} />
                            <div className="space-y-1 text-xs mt-2">
                              <div className={`flex items-center gap-1 ${requirements.minLength ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {requirements.minLength ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                At least 8 characters
                              </div>
                              <div className={`flex items-center gap-1 ${requirements.hasUppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {requirements.hasUppercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                One uppercase letter
                              </div>
                              <div className={`flex items-center gap-1 ${requirements.hasLowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {requirements.hasLowercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                One lowercase letter
                              </div>
                              <div className={`flex items-center gap-1 ${requirements.hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {requirements.hasNumber ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                One number
                              </div>
                            </div>
                          </>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name='confirmPassword'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Confirm Password *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder='Re-enter password'
                              className="h-10 pr-10"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-10 w-10 px-0"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        {confirmPassword && password && (
                          <FormDescription className={confirmPassword === password ? 'text-green-600' : 'text-red-600'}>
                            {confirmPassword === password ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Passwords match
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                Passwords don't match
                              </span>
                            )}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Generate Password Button */}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Secure Password
                  </Button>
                </div>
              </div>

              {/* Role Selection */}
              <div className='grid grid-cols-1 gap-6'>
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
                      <div className="mt-2">
                        <RolePermissionsDetail role={selectedRole} />
                      </div>
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

      {/* Success Dialog */}
      {createdUser && (
        <UserCreatedSuccessDialog
          open={successDialogOpen}
          onOpenChange={setSuccessDialogOpen}
          userName={createdUser.name}
          userEmail={createdUser.email}
          temporaryPassword={createdUser.password}
          userId={createdUser.id}
          welcomeEmailSent={createdUser.welcomeEmailSent}
        />
      )}
    </div>
  )
}

export default UserCreateForm
