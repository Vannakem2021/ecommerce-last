'use client'

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
import { useToast } from '@/hooks/use-toast'
import { updateUser } from '@/lib/actions/user.actions'
import { IUser } from '@/lib/db/models/user.model'
import { UserUpdateSchema } from '@/lib/validator'
import { getAssignableRoles } from '@/lib/rbac-utils'
import { UserIcon, ShieldIcon, InfoIcon, CrownIcon, UserCogIcon, UsersIcon, CalendarIcon, ActivityIcon } from 'lucide-react'

interface SystemUserEditFormProps {
  user: IUser
  currentUserRole: string
}

const SystemUserEditForm = ({ user, currentUserRole }: SystemUserEditFormProps) => {
  const router = useRouter()
  const { toast } = useToast()

  // Get roles that current user can assign (excluding 'user' role for system users)
  const allAssignableRoles = getAssignableRoles(currentUserRole)
  const assignableRoles = allAssignableRoles.filter(role => role !== 'user')

  const form = useForm<z.infer<typeof UserUpdateSchema>>({
    resolver: zodResolver(UserUpdateSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'seller',
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100 border-red-200 dark:bg-red-950 dark:border-red-800'
      case 'manager': return 'text-amber-600 bg-amber-100 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
      case 'seller': return 'text-emerald-600 bg-emerald-100 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800'
      default: return 'text-blue-600 bg-blue-100 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
    }
  }


  async function onSubmit(values: z.infer<typeof UserUpdateSchema>) {
    try {
      const res = await updateUser({
        ...values,
        _id: user._id,
      })
      if (!res.success)
        return toast({
          variant: 'destructive',
          description: res.message,
        })

      toast({
        description: res.message,
      })
      form.reset()
      router.push(`/admin/users`)
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
          {/* System User Overview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-950">
                  <InfoIcon className="h-4 w-4 text-slate-600" />
                </div>
                System User Overview
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Current role badge */}
              <div className="flex items-center gap-4">
                <div className={`px-3 py-2 rounded-lg border font-medium text-sm flex items-center gap-2 ${getRoleColor(user.role)}`}>
                  {getRoleIcon(user.role)}
                  Current Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Role determines system access and permissions
                </div>
              </div>

              {/* System user details display */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/30 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <ShieldIcon className="h-4 w-4" />
                      User ID
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 font-mono" title={user._id}>
                      {user._id.length > 12 ? `${user._id.substring(0, 8)}...${user._id.substring(user._id.length - 4)}` : user._id}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      Created
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <ActivityIcon className="h-4 w-4" />
                      Last Login
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <ShieldIcon className="h-4 w-4" />
                      Access Level
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 capitalize">
                      {user.role === 'admin' ? 'Full Access' :
                       user.role === 'manager' ? 'Management' :
                       user.role === 'seller' ? 'Sales' : 'Limited'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                          placeholder='Enter full name'
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        System user&apos;s display name for admin interfaces
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
                        Used for login and system notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Role & Permissions Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-green-50 dark:bg-green-950">
                  <ShieldIcon className="h-4 w-4 text-green-600" />
                </div>
                Role & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">System Role *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder='Select system role' />
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
                      Updating system user...
                    </span>
                  ) : (
                    'Review all changes before updating the system user'
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
                    {form.formState.isSubmitting ? 'Updating...' : 'Update User'}
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

export default SystemUserEditForm