import { Metadata } from 'next'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import UserCreateForm from './user-create-form'

export const metadata: Metadata = {
  title: 'Create User',
}

export default async function CreateUserPage() {
  const session = await auth()
  
  // Check if user has permission to create users
  if (!session?.user?.role || !hasPermission(session.user.role, 'users.create')) {
    throw new Error('Insufficient permissions to create users')
  }

  return (
    <div className='space-y-2'>
      <h1 className='h1-bold'>Create User</h1>
      <div className='my-8'>
        <UserCreateForm currentUserRole={session.user.role} />
      </div>
    </div>
  )
}
