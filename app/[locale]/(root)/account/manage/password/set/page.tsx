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
          <Link href='/account/manage' className='text-muted-foreground hover:text-foreground'>
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
