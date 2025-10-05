# Password Change Implementation - OAuth Strategy

## 🔍 Current Authentication Setup Analysis

### **Findings:**

1. **User Model** (`/lib/db/models/user.model.ts`):
   - `password: { type: String }` - **Optional field** ✅
   - Password can be `null` or `undefined` for OAuth users

2. **Auth Providers** (`/auth.ts`):
   - ✅ **Google OAuth** - Users sign in with Google (no password)
   - ✅ **Credentials Provider** - Users sign in with email/password

3. **User Scenarios:**
   - **Type A**: User signed up with email/password → `password` field exists
   - **Type B**: User signed up with Google → `password` field is `null`/`undefined`
   - **Type C**: User signed up with Google, later set a password → `password` field exists

---

## 🎯 Recommended Strategy

### **Approach: Conditional Password Management**

Show different UI based on whether user has a password:

```typescript
// Detect if user has a password
const hasPassword = !!user.password

if (hasPassword) {
  // Show: "Change Password" option
} else {
  // Show: "Set Password" option (account linking)
}
```

---

## 📋 Implementation Plan

### **Step 1: Add Password Detection**

**File:** `/lib/actions/user.actions.ts`

```typescript
export async function getUserAuthMethod(userId: string) {
  try {
    await connectToDatabase()
    const user = await User.findById(userId).select('password email')
    
    if (!user) {
      throw new Error('User not found')
    }

    return {
      success: true,
      data: {
        hasPassword: !!user.password,
        email: user.email,
        authMethods: {
          credentials: !!user.password,
          google: !user.password, // Simplified - could track this explicitly
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error)
    }
  }
}
```

---

### **Step 2: Update Settings Page to Show Appropriate Option**

**File:** `/app/[locale]/(root)/account/manage/page.tsx`

```tsx
import { getUserAuthMethod } from '@/lib/actions/user.actions'

export default async function ProfilePage() {
  const session = await auth()
  
  // Get user's auth method
  const authMethod = await getUserAuthMethod(session?.user?.id!)
  const hasPassword = authMethod.data?.hasPassword

  return (
    <div className='space-y-6'>
      {/* ... other sections ... */}

      {/* Security Settings Section */}
      <Card>
        <CardContent className='p-4'>
          <div>
            <h3 className='font-bold mb-2'>Security Settings</h3>
            <div className='space-y-3 text-sm text-gray-600'>
              
              {/* Password Section - CONDITIONAL */}
              <div className='flex items-center justify-between py-2'>
                <div>
                  <div className='font-medium text-gray-900'>
                    {hasPassword ? 'Password' : 'Set Password'}
                  </div>
                  <div className='text-xs text-gray-500'>
                    {hasPassword 
                      ? 'Last updated recently' 
                      : 'Add password to enable email/password login'
                    }
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  {hasPassword ? (
                    <>
                      <Badge variant='outline'>Secure</Badge>
                      <Link href='/account/manage/password'>
                        <Button variant='outline' size='sm'>
                          Change
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link href='/account/manage/password/set'>
                      <Button variant='outline' size='sm'>
                        Set Password
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Connected Accounts */}
              <div className='flex items-center justify-between py-2'>
                <div>
                  <div className='font-medium text-gray-900'>Connected Accounts</div>
                  <div className='text-xs text-gray-500'>
                    {hasPassword 
                      ? 'Email/Password & Google' 
                      : 'Google only'
                    }
                  </div>
                </div>
                <Link href='/account/manage/connected-accounts'>
                  <Button variant='outline' size='sm'>
                    Manage
                  </Button>
                </Link>
              </div>

              {/* ... rest of security settings ... */}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### **Step 3: Change Password Page (For Users WITH Password)**

**File:** `/app/[locale]/(root)/account/manage/password/page.tsx`

```tsx
import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUserAuthMethod } from '@/lib/actions/user.actions'
import ChangePasswordForm from './change-password-form'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Change Password',
}

export default async function ChangePasswordPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  // Check if user has a password
  const authMethod = await getUserAuthMethod(session.user.id)
  
  if (!authMethod.success || !authMethod.data?.hasPassword) {
    // User doesn't have a password (OAuth user)
    redirect('/account/manage/password/set')
  }

  return (
    <div className='space-y-6'>
      <div>
        <div className='flex gap-2 mb-1'>
          <Link href='/account' className='text-muted-foreground hover:text-foreground'>
            Your Account
          </Link>
          <span className='text-muted-foreground'>›</span>
          <Link href='/account/manage' className='text-muted-foreground hover:text-foreground'>
            Settings
          </Link>
          <span className='text-muted-foreground'>›</span>
          <span>Change Password</span>
        </div>
        <h1 className='text-3xl font-bold'>Change Password</h1>
        <p className='text-muted-foreground mt-1'>
          Update your password to keep your account secure
        </p>
      </div>

      <ChangePasswordForm />
    </div>
  )
}
```

---

### **Step 4: Change Password Form Component**

**File:** `/app/[locale]/(root)/account/manage/password/change-password-form.tsx`

```tsx
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
                      <Progress 
                        value={passwordStrength} 
                        className={getStrengthColor(passwordStrength)}
                      />
                    </div>
                  )}

                  {/* Password Requirements */}
                  <FormDescription className='space-y-1 mt-2'>
                    <div className='text-xs space-y-1'>
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
                  </FormDescription>
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
```

---

### **Step 5: Set Password Page (For OAuth Users WITHOUT Password)**

**File:** `/app/[locale]/(root)/account/manage/password/set/page.tsx`

```tsx
import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUserAuthMethod } from '@/lib/actions/user.actions'
import SetPasswordForm from './set-password-form'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Set Password',
}

export default async function SetPasswordPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  // Check if user already has a password
  const authMethod = await getUserAuthMethod(session.user.id)
  
  if (authMethod.success && authMethod.data?.hasPassword) {
    // User already has a password, redirect to change password
    redirect('/account/manage/password')
  }

  return (
    <div className='space-y-6'>
      <div>
        <div className='flex gap-2 mb-1'>
          <Link href='/account' className='text-muted-foreground hover:text-foreground'>
            Your Account
          </Link>
          <span className='text-muted-foreground'>›</span>
          <Link href='/account/manage' className='text-muted-foreground hover:text-foreground'>
            Settings
          </Link>
          <span className='text-muted-foreground'>›</span>
          <span>Set Password</span>
        </div>
        <h1 className='text-3xl font-bold'>Set Password</h1>
        <p className='text-muted-foreground mt-1'>
          Add a password to your account for additional login options
        </p>
      </div>

      {/* Info Card */}
      <Card className='bg-blue-50 border-blue-200'>
        <CardContent className='p-4'>
          <h3 className='font-medium text-blue-900 mb-2'>
            Why set a password?
          </h3>
          <ul className='text-sm text-blue-700 space-y-1 list-disc list-inside'>
            <li>Access your account even if you can't use Google sign-in</li>
            <li>Enhanced account security with multiple login methods</li>
            <li>Backup authentication method</li>
          </ul>
        </CardContent>
      </Card>

      <SetPasswordForm />
    </div>
  )
}
```

---

### **Step 6: Set Password Form (For OAuth Users)**

**File:** `/app/[locale]/(root)/account/manage/password/set/set-password-form.tsx`

```tsx
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
import { Progress } from '@/components/ui/progress'

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
                      <Progress 
                        value={passwordStrength} 
                        className={getStrengthColor(passwordStrength)}
                      />
                    </div>
                  )}

                  {/* Password Requirements */}
                  <FormDescription className='space-y-1 mt-2'>
                    <div className='text-xs space-y-1'>
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
                  </FormDescription>
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
```

---

### **Step 7: Server Actions**

**File:** `/lib/actions/user.actions.ts` (Add these functions)

```typescript
// Check if user has password
export async function getUserAuthMethod(userId: string) {
  try {
    await connectToDatabase()
    const user = await User.findById(userId).select('password email')
    
    if (!user) {
      throw new Error('User not found')
    }

    return {
      success: true,
      data: {
        hasPassword: !!user.password,
        email: user.email,
      }
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error)
    }
  }
}

// Change password (for users who already have a password)
export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    await connectToDatabase()

    const user = await User.findById(session.user.id)
    if (!user) {
      throw new Error('User not found')
    }

    // Verify user has a password
    if (!user.password) {
      throw new Error('No password set. Please use "Set Password" instead.')
    }

    // Verify current password
    const isMatch = await bcrypt.compare(data.currentPassword, user.password)
    if (!isMatch) {
      throw new Error('Current password is incorrect')
    }

    // Hash and update new password
    user.password = await bcrypt.hash(data.newPassword, 12)
    await user.save()

    revalidatePath('/account/manage')

    // TODO: Send email notification
    // await sendPasswordChangeEmail(user.email, user.name)

    return {
      success: true,
      message: 'Password changed successfully',
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    }
  }
}

// Set password (for OAuth users who don't have a password)
export async function setPassword(data: {
  password: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    await connectToDatabase()

    const user = await User.findById(session.user.id)
    if (!user) {
      throw new Error('User not found')
    }

    // Check if user already has a password
    if (user.password) {
      throw new Error('Password already set. Use "Change Password" instead.')
    }

    // Hash and set password
    user.password = await bcrypt.hash(data.password, 12)
    await user.save()

    revalidatePath('/account/manage')

    // TODO: Send email notification
    // await sendPasswordSetEmail(user.email, user.name)

    return {
      success: true,
      message: 'Password set successfully! You can now sign in with email/password.',
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    }
  }
}
```

---

## 🎯 User Experience Flow

### **Scenario 1: Email/Password User**
```
User signs in with email/password
→ Goes to Settings
→ Sees "Password" with "Secure" badge and "Change" button
→ Clicks "Change"
→ Enter current password + new password
→ Password changed ✅
```

### **Scenario 2: Google OAuth User (No Password)**
```
User signs in with Google
→ Goes to Settings
→ Sees "Set Password" with "Add password to enable email/password login"
→ Clicks "Set Password"
→ Creates new password
→ Can now sign in with BOTH Google OR email/password ✅
```

### **Scenario 3: Google User Who Set Password**
```
User signed in with Google
→ Previously set a password
→ Goes to Settings
→ Sees "Password" with "Secure" badge and "Change" button
→ Can change password just like Scenario 1 ✅
```

---

## 🔐 Security Considerations

1. **Password Strength:**
   - Minimum 8 characters
   - Must include: uppercase, lowercase, number
   - Visual strength meter

2. **Current Password Verification:**
   - Required when changing password
   - Prevents unauthorized changes

3. **Email Notifications:**
   - Send email when password is changed
   - Send email when password is set (OAuth linking)
   - Allows user to detect unauthorized changes

4. **Session Management:**
   - Optional: Logout other sessions after password change
   - Keep current session active

---

## 📊 Summary

### **Key Points:**
1. ✅ **Conditional UI** - Show "Change" or "Set Password" based on `hasPassword`
2. ✅ **Account Linking** - Google users can add password for backup login
3. ✅ **Security** - Current password required for changes
4. ✅ **UX** - Clear distinction between change vs set
5. ✅ **Flexibility** - Users can sign in with either method

### **Files to Create:**
- `/lib/actions/user.actions.ts` - Add 3 functions
- `/app/[locale]/(root)/account/manage/password/page.tsx` - Change password page
- `/app/[locale]/(root)/account/manage/password/change-password-form.tsx` - Form component
- `/app/[locale]/(root)/account/manage/password/set/page.tsx` - Set password page
- `/app/[locale]/(root)/account/manage/password/set/set-password-form.tsx` - Form component

### **Files to Update:**
- `/app/[locale]/(root)/account/manage/page.tsx` - Add conditional password section

---

**This approach handles all scenarios and provides a seamless experience for both credential and OAuth users!** 🎉
