'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { createUserByAdmin } from '@/lib/actions/user.actions'
import { AdminUserCreateSchema } from '@/lib/validator'
import { getAssignableRoles } from '@/lib/rbac-utils'
import { UserRole } from '@/lib/constants'

interface UserCreateFormProps {
  currentUserRole: string
}

const UserCreateForm = ({ currentUserRole }: UserCreateFormProps) => {
  const router = useRouter()
  const { toast } = useToast()

  // Get roles that current user can assign
  const assignableRoles = getAssignableRoles(currentUserRole)

  const form = useForm<z.infer<typeof AdminUserCreateSchema>>({
    resolver: zodResolver(AdminUserCreateSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'user',
      password: '',
      sendWelcomeEmail: false,
    },
  })

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
    <Form {...form}>
      <form
        method='post'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-8'
      >
        <div className='flex flex-col gap-5 md:flex-row'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='Enter user name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type='email' 
                    placeholder='Enter user email' 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className='flex flex-col gap-5 md:flex-row'>
          <FormField
            control={form.control}
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
          <FormField
            control={form.control}
            name='role'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a role' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='sendWelcomeEmail'
          render={({ field }) => (
            <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className='space-y-1 leading-none'>
                <FormLabel>
                  Send welcome email to user
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className='flex-between'>
          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating...' : 'Create User'}
          </Button>
          <Button
            variant='outline'
            type='button'
            onClick={() => router.push('/admin/users')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default UserCreateForm
