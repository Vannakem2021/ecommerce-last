import { notFound } from 'next/navigation'

import { getUserById } from '@/lib/actions/user.actions'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'

import UserEditForm from './user-edit-form'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit User',
}

export default async function UserEditPage(props: {
  params: Promise<{
    id: string
  }>
}) {
  const params = await props.params
  const { id } = params

  const session = await auth()

  // Check if user has permission to update users
  if (!session?.user?.role || !hasPermission(session.user.role, 'users.update')) {
    throw new Error('Insufficient permissions to edit users')
  }

  const user = await getUserById(id)
  if (!user) notFound()

  return (
    <main className='max-w-6xl mx-auto p-4'>
      <div className='flex mb-4'>
        <Link href='/admin/users'>Users</Link>
        <span className='mx-1'>›</span>
        <Link href={`/admin/users/${user._id}`}>{user._id}</Link>
      </div>

      <div className='my-8'>
        <UserEditForm user={user} currentUserRole={session.user.role} />
      </div>
    </main>
  )
}
