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
import { deleteUser, getAllUsersWithPermissions } from '@/lib/actions/user.actions'
import { IUser } from '@/lib/db/models/user.model'
import { formatId } from '@/lib/utils'
import { Plus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin Users',
}

export default async function AdminUser(props: {
  searchParams: Promise<{ page: string }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1

  // Get users with server-side permission filtering
  const usersData = await getAllUsersWithPermissions({
    page,
  })

  return (
    <div className='space-y-2'>
      <div className='flex-between'>
        <h1 className='h1-bold'>Users</h1>
        {usersData?.permissions.canCreate && (
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
            {usersData?.data.map((user: IUser & { canEdit?: boolean; canDelete?: boolean }) => (
              <TableRow key={user._id}>
                <TableCell>{formatId(user._id)}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className='capitalize'>{user.role}</span>
                </TableCell>
                <TableCell className='flex gap-1'>
                  {user.canEdit && (
                    <Button asChild variant='outline' size='sm'>
                      <Link href={`/admin/users/${user._id}`}>Edit</Link>
                    </Button>
                  )}
                  {user.canDelete && (
                    <DeleteDialog id={user._id} action={deleteUser} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {usersData?.totalPages && usersData.totalPages > 1 && (
          <Pagination page={page} totalPages={usersData.totalPages} />
        )}
      </div>
    </div>
  )
}
