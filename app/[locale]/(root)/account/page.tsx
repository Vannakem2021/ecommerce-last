import { Card, CardContent } from '@/components/ui/card'
import { Metadata } from 'next'
import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

const PAGE_TITLE = 'Overview'
export const metadata: Metadata = {
  title: PAGE_TITLE,
}

export default async function AccountPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/sign-in')
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Overview</h1>
        <p className='text-muted-foreground mt-1'>
          Your account information and details
        </p>
      </div>

      <Card>
        <CardContent className='p-0'>
          <div className='divide-y'>
            <div className='grid grid-cols-[200px_1fr] gap-4 px-6 py-5 hover:bg-accent/20 transition-colors'>
              <div className='text-muted-foreground font-medium'>Name</div>
              <div className='font-semibold'>{session.user.name || 'Not provided'}</div>
            </div>

            <div className='grid grid-cols-[200px_1fr] gap-4 px-6 py-5 hover:bg-accent/20 transition-colors'>
              <div className='text-muted-foreground font-medium'>Email</div>
              <div className='font-semibold'>{session.user.email}</div>
            </div>

            {session.user.phone && (
              <div className='grid grid-cols-[200px_1fr] gap-4 px-6 py-5 hover:bg-accent/20 transition-colors'>
                <div className='text-muted-foreground font-medium'>Phone</div>
                <div className='font-semibold'>{session.user.phone}</div>
              </div>
            )}

            <div className='grid grid-cols-[200px_1fr] gap-4 px-6 py-5 hover:bg-accent/20 transition-colors'>
              <div className='text-muted-foreground font-medium'>Member Since</div>
              <div className='font-semibold'>
                {new Date(session.user.createdAt || Date.now()).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            <div className='grid grid-cols-[200px_1fr] gap-4 px-6 py-5 hover:bg-accent/20 transition-colors'>
              <div className='text-muted-foreground font-medium'>Account Status</div>
              <div>
                <span className='px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700'>
                  Active
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
