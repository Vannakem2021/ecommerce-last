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
import { useToast } from '@/hooks/use-toast'
import { updateUser } from '@/lib/actions/user.actions'
import { IUser } from '@/lib/db/models/user.model'
import { UserUpdateSchema } from '@/lib/validator'
import { UserIcon, InfoIcon, MapPinIcon, CreditCardIcon, MailIcon, CalendarIcon } from 'lucide-react'

interface CustomerEditFormProps {
  user: IUser
  currentUserRole: string
}

const CustomerEditForm = ({ user }: CustomerEditFormProps) => {
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof UserUpdateSchema>>({
    resolver: zodResolver(UserUpdateSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
    },
  })

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
          {/* Customer Overview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-950">
                  <InfoIcon className="h-4 w-4 text-slate-600" />
                </div>
                Customer Overview
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Customer details display */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/30 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      Customer ID
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 font-mono" title={user._id}>
                      {user._id.length > 12 ? `${user._id.substring(0, 8)}...${user._id.substring(user._id.length - 4)}` : user._id}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      Member Since
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      Last Login
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <MailIcon className="h-4 w-4" />
                      Email Status
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      {user.emailVerified ? (
                        <span className="text-green-600 font-medium">Verified</span>
                      ) : (
                        <span className="text-amber-600 font-medium">Unverified</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">0</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">$0.00</p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">$0.00</p>
                  <p className="text-sm text-muted-foreground">Average Order</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                </div>
                Personal Information
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
                          placeholder='Enter customer full name'
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Customer&apos;s display name for orders and account
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
                        Used for login, order notifications, and marketing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950">
                  <MapPinIcon className="h-4 w-4 text-amber-600" />
                </div>
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {user.address ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/30 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Full Name</p>
                      <p className="text-slate-600 dark:text-slate-400">{user.address.fullName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Phone</p>
                      <p className="text-slate-600 dark:text-slate-400">{user.address.phone || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-slate-900 dark:text-slate-100">Address</p>
                      <p className="text-slate-600 dark:text-slate-400">
                        {(user.address && 'houseNumber' in user.address) && user.address.houseNumber && `${user.address.houseNumber} `}
                        {user.address.street && `${user.address.street}, `}
                        {(user.address && 'communeName' in user.address) && user.address.communeName && `${user.address.communeName}, `}
                        {(user.address && 'districtName' in user.address) && user.address.districtName && `${user.address.districtName}, `}
                        {(user.address && 'provinceName' in user.address) && user.address.provinceName ? user.address.provinceName : 'Address not complete'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        No Address Information
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-200">
                        Customer hasn&apos;t provided address details yet
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950">
                  <CreditCardIcon className="h-4 w-4 text-purple-600" />
                </div>
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {user.paymentMethod ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/30 p-4">
                  <div className="text-sm">
                    <p className="font-medium text-slate-900 dark:text-slate-100">Payment Method</p>
                    <p className="text-slate-600 dark:text-slate-400 capitalize">{user.paymentMethod}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30 p-4">
                  <div className="flex items-center gap-3">
                    <CreditCardIcon className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        No Payment Method
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-200">
                        Customer hasn&apos;t set up payment method yet
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Status Notice */}
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-4">
                <div className="flex items-start gap-3">
                  <UserIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Customer Account
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-200">
                      This customer account has access to shopping features, order history, and account management. Customer data is protected according to privacy policies.
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
                      Updating customer account...
                    </span>
                  ) : (
                    'Review all changes before updating the customer account'
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
                    {form.formState.isSubmitting ? 'Updating...' : 'Update Customer'}
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

export default CustomerEditForm