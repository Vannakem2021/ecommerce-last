import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUserAuthMethod } from '@/lib/actions/user.actions'
import ChangePasswordForm from './change-password-form'
import Link from 'next/link'

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
          <Link href='/account/manage' className='text-muted-foreground hover:text-foreground'>
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
