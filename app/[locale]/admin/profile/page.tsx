import { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'

import { auth } from '@/auth'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Lock, Settings } from 'lucide-react'

const PAGE_TITLE = 'Profile'
export const metadata: Metadata = {
  title: PAGE_TITLE,
}
export default async function AdminProfilePage() {
  const session = await auth()
  return (
    <div className='container mx-auto py-6 space-y-8'>
      <SessionProvider session={session}>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold tracking-tight'>{PAGE_TITLE}</h1>
        </div>

        <div className='grid gap-6 md:grid-cols-1 lg:grid-cols-3'>
          {/* Profile Overview Card */}
          <div className='lg:col-span-1'>
            <Card>
              <CardHeader className='text-center'>
                <div className='flex justify-center mb-4'>
                  <div className='h-24 w-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold'>
                    {session?.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                </div>
                <CardTitle className='text-xl'>{session?.user?.name}</CardTitle>
                <Badge variant='secondary' className='w-fit mx-auto'>
                  Administrator
                </Badge>
              </CardHeader>
            </Card>
          </div>

          {/* Account Details Card */}
          <div className='lg:col-span-2'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Settings className='h-5 w-5' />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Name Section */}
                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'>
                      <User className='h-5 w-5 text-primary' />
                    </div>
                    <div>
                      <h3 className='font-semibold text-sm text-muted-foreground uppercase tracking-wide'>Full Name</h3>
                      <p className='text-base font-medium'>{session?.user.name}</p>
                    </div>
                  </div>
                  <Link href='/admin/profile/name'>
                    <Button size='sm' variant='outline'>
                      Edit
                    </Button>
                  </Link>
                </div>

                {/* Email Section */}
                <div className='flex items-center justify-between p-4 border rounded-lg bg-muted/50'>
                  <div className='flex items-center gap-3'>
                    <div className='h-10 w-10 rounded-full bg-secondary flex items-center justify-center'>
                      <Mail className='h-5 w-5 text-secondary-foreground' />
                    </div>
                    <div>
                      <h3 className='font-semibold text-sm text-muted-foreground uppercase tracking-wide'>Email Address</h3>
                      <p className='text-base font-medium'>{session?.user.email}</p>
                      <p className='text-xs text-muted-foreground mt-1'>Coming in next version</p>
                    </div>
                  </div>
                  <Button size='sm' variant='outline' disabled>
                    Edit
                  </Button>
                </div>

                {/* Password Section */}
                <div className='flex items-center justify-between p-4 border rounded-lg bg-muted/50'>
                  <div className='flex items-center gap-3'>
                    <div className='h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center'>
                      <Lock className='h-5 w-5 text-destructive' />
                    </div>
                    <div>
                      <h3 className='font-semibold text-sm text-muted-foreground uppercase tracking-wide'>Password</h3>
                      <p className='text-base font-medium'>••••••••••••</p>
                      <p className='text-xs text-muted-foreground mt-1'>Coming in next version</p>
                    </div>
                  </div>
                  <Button size='sm' variant='outline' disabled>
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SessionProvider>
    </div>
  )
}