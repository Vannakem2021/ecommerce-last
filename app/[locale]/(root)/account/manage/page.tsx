import { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'

import { auth } from '@/auth'
import { getUserAuthMethod } from '@/lib/actions/user.actions'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const PAGE_TITLE = 'Login & Security'
export const metadata: Metadata = {
  title: PAGE_TITLE,
}
export default async function ProfilePage() {
  const session = await auth()
  
  // Get user's auth method to determine if they have a password
  const authMethod = await getUserAuthMethod(session?.user?.id!)
  const hasPassword = authMethod.data?.hasPassword || false

  return (
    <div className='space-y-6'>
      <SessionProvider session={session}>
        <div>
          <div className='flex gap-2 mb-1'>
            <Link href='/account' className='text-muted-foreground hover:text-foreground'>Your Account</Link>
            <span className='text-muted-foreground'>›</span>
            <span>{PAGE_TITLE}</span>
          </div>
          <h1 className='text-3xl font-bold'>{PAGE_TITLE}</h1>
          <p className='text-muted-foreground mt-1'>
            Manage your name, email, and security settings
          </p>
        </div>

        {/* Name Section */}
        <Card>
          <CardContent className='p-4 flex justify-between flex-wrap'>
            <div>
              <h3 className='font-bold'>Name</h3>
              <p>{session?.user.name}</p>
            </div>
            <div>
              <Link href='/account/manage/name'>
                <Button className='rounded-full w-32' variant='outline'>
                  Edit
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Email Section */}
        <Card>
          <CardContent className='p-4 flex justify-between flex-wrap'>
            <div>
              <h3 className='font-bold'>Email</h3>
              <p className='text-gray-700'>{session?.user.email}</p>
              <p className='text-sm text-gray-500 mt-1'>
                Your email is verified and secure
              </p>
            </div>
            <div>
              <Badge variant='outline' className='bg-green-50 text-green-700 border-green-300'>
                ✓ Verified
              </Badge>
            </div>
          </CardContent>
        </Card>

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

                <div className='flex items-center justify-between py-2'>
                  <div>
                    <div className='font-medium text-gray-900'>Two-Factor Authentication</div>
                    <div className='text-xs text-gray-500'>Add extra security (Coming soon)</div>
                  </div>
                  <Badge variant='outline' className='text-gray-400'>Coming Soon</Badge>
                </div>
                <div className='flex items-center justify-between py-2'>
                  <div>
                    <div className='font-medium text-gray-900'>Login Activity</div>
                    <div className='text-xs text-gray-500'>Monitor your account access</div>
                  </div>
                  <Button variant='outline' size='sm' disabled className='text-xs'>
                    View History
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </SessionProvider>
    </div>
  )
}
