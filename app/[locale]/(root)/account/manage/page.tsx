import { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'

import { auth } from '@/auth'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

const PAGE_TITLE = 'Login & Security'
export const metadata: Metadata = {
  title: PAGE_TITLE,
}
export default async function ProfilePage() {
  const session = await auth()
  return (
    <div className='mb-24'>
      <SessionProvider session={session}>
        <div className='flex gap-2 '>
          <Link href='/account'>Your Account</Link>
          <span>›</span>
          <span>{PAGE_TITLE}</span>
        </div>
        <h1 className='h1-bold py-4'>{PAGE_TITLE}</h1>
        <Card className='max-w-2xl '>
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
          <Separator />
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
          <Separator />
          <CardContent className='p-4'>
            <div>
              <h3 className='font-bold mb-2'>Security Settings</h3>
              <div className='space-y-3 text-sm text-gray-600'>
                <div className='flex items-center justify-between py-2'>
                  <div>
                    <div className='font-medium text-gray-900'>Password</div>
                    <div className='text-xs text-gray-500'>Last updated recently</div>
                  </div>
                  <Badge variant='outline'>Secure</Badge>
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
