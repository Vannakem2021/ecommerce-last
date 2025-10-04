import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Metadata } from 'next'

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
    <div>
      <h1 className='text-2xl font-bold mb-6'>Overview</h1>

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex justify-between items-center py-3 border-b'>
            <span className='text-sm text-muted-foreground'>Email</span>
            <span className='font-medium'>{session.user.email}</span>
          </div>
          
          {session.user.phone && (
            <div className='flex justify-between items-center py-3 border-b'>
              <span className='text-sm text-muted-foreground'>Phone</span>
              <span className='font-medium'>{session.user.phone}</span>
            </div>
          )}

          <div className='flex justify-between items-center py-3 border-b'>
            <span className='text-sm text-muted-foreground'>Member Since</span>
            <span className='font-medium'>
              {new Date(session.user.createdAt || Date.now()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>

          <div className='flex justify-between items-center py-3'>
            <span className='text-sm text-muted-foreground'>Account Status</span>
            <Badge variant='default' className='bg-green-500 hover:bg-green-600'>
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
