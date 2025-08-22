import { Metadata } from 'next'
import Link from 'next/link'

import { auth } from '@/auth'
import DeleteDialog from '@/components/shared/delete-dialog'
import Pagination from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { deleteUser, getAllUsers } from '@/lib/actions/user.actions'
import { IUser } from '@/lib/db/models/user.model'
import { formatId } from '@/lib/utils'
import { hasPermission, canAssignRole } from '@/lib/rbac-utils'
import { Plus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin Users',
}

export default async function AdminUser(props: {
  searchParams: Promise<{ page: string }>
}) {
  const searchParams = await props.searchParams
  const session = await auth()

  // Check if user has permission to read users
  if (!session?.user?.role || !hasPermission(session.user.role, 'users.read')) {
    throw new Error('Insufficient permissions to view users')
  }

  const page = Number(searchParams.page) || 1
  const users = await getAllUsers({
    page,
  })

  // Check permissions
  const canCreateUsers = hasPermission(session.user.role, 'users.create')
  const canUpdateUsers = hasPermission(session.user.role, 'users.update')
  const canDeleteUsers = hasPermission(session.user.role, 'users.delete')

  return (
    <div className='space-y-2'>
      <div className='flex-between'>
        <h1 className='h1-bold'>Users</h1>
        {canCreateUsers && (
          <Button asChild>
            <Link href='/admin/users/create'>
              <Plus className='w-4 h-4 mr-2' />
              Create User
            </Link>
          </Button>
        )}
      </div>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.data.map((user: IUser) => {
              // Check if current user can manage this user (based on role hierarchy)
              const canManageThisUser = canAssignRole(session.user.role, user.role)

              return (
                <TableRow key={user._id}>
                  <TableCell>{formatId(user._id)}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className='capitalize'>{user.role}</span>
                  </TableCell>
                  <TableCell className='flex gap-1'>
                    {canUpdateUsers && canManageThisUser && (
                      <Button asChild variant='outline' size='sm'>
                        <Link href={`/admin/users/${user._id}`}>Edit</Link>
                      </Button>
                    )}
                    {canDeleteUsers && canManageThisUser && session.user.id !== user._id && (
                      <DeleteDialog id={user._id} action={deleteUser} />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {users?.totalPages > 1 && (
          <Pagination page={page} totalPages={users?.totalPages} />
        )}
      </div>
    </div>
  )
}
