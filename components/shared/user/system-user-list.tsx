'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IUser } from '@/lib/db/models/user.model'
import { formatDateTime } from '@/lib/utils'
import { Eye, ShieldIcon, CrownIcon, UserCogIcon, UsersIcon, ClockIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'

interface SystemUserWithStats extends IUser {
  canEdit?: boolean
  canDelete?: boolean
  lastLoginAt?: Date
  permissions?: string[]
}

export default function SystemUserList({
  data,
}: {
  data: SystemUserWithStats[]
  totalUsers: number
  page: number
  totalPages: number
}) {

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <CrownIcon className='h-3.5 w-3.5 text-red-600' />
      case 'manager':
        return <UserCogIcon className='h-3.5 w-3.5 text-amber-600' />
      case 'seller':
        return <UsersIcon className='h-3.5 w-3.5 text-emerald-600' />
      default:
        return <ShieldIcon className='h-3.5 w-3.5 text-blue-600' />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'manager':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
      case 'seller':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
  }

  const getLoginStatus = (lastLoginAt?: Date | string) => {
    if (!lastLoginAt) return { text: 'Never', color: 'text-red-600' }

    const now = new Date()
    const loginDate = typeof lastLoginAt === 'string' ? new Date(lastLoginAt) : lastLoginAt
    const diffInDays = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return { text: 'Today', color: 'text-green-600' }
    if (diffInDays === 1) return { text: '1 day ago', color: 'text-green-600' }
    if (diffInDays <= 7) return { text: `${diffInDays} days ago`, color: 'text-yellow-600' }
    if (diffInDays <= 30) return { text: `${diffInDays} days ago`, color: 'text-orange-600' }
    return { text: `${diffInDays} days ago`, color: 'text-red-600' }
  }

  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow className='bg-muted/30 hover:bg-muted/50 border-b'>
            <TableHead className='font-semibold text-foreground'>USER</TableHead>
            <TableHead className='font-semibold text-foreground'>ROLE</TableHead>
            <TableHead className='font-semibold text-foreground'>LAST LOGIN</TableHead>
            <TableHead className='font-semibold text-foreground'>CREATED</TableHead>
            <TableHead className='w-[100px] font-semibold text-foreground'>ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className='text-center py-8 text-muted-foreground'>
                <div className='flex flex-col items-center gap-2'>
                  <ShieldIcon className='h-8 w-8 text-muted-foreground/50' />
                  <p>No system users found</p>
                  <p className='text-sm'>System users will appear here when added</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((user) => {
              const loginStatus = getLoginStatus(user.lastLoginAt)
              return (
                <TableRow key={user._id} className='hover:bg-muted/30 transition-colors border-b border-border/50'>
                  <TableCell className='py-3'>
                    <div className='flex items-center gap-3'>
                      <div className='p-1.5 rounded-md bg-slate-50 dark:bg-slate-950'>
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <div className='font-medium text-foreground'>{user.name}</div>
                        <div className='text-sm text-muted-foreground'>{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='py-3'>
                    <Badge
                      variant='secondary'
                      className={getRoleBadgeColor(user.role)}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className='py-3'>
                    <div className='flex items-center gap-2'>
                      <ClockIcon className='h-3.5 w-3.5 text-muted-foreground' />
                      <div>
                        <div className={`text-sm font-medium ${loginStatus.color}`}>
                          {loginStatus.text}
                        </div>
                        {user.lastLoginAt && (
                          <div className='text-xs text-muted-foreground'>
                            {formatDateTime(user.lastLoginAt).dateTime}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='py-3 text-muted-foreground'>
                    <div className='text-sm'>
                      {formatDateTime(user.createdAt).dateOnly}
                    </div>
                  </TableCell>
                  <TableCell className='py-3'>
                    <div className='flex items-center gap-1'>
                      {user.canEdit && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button asChild variant='ghost' size='sm' className='h-8 w-8 p-0 hover:bg-muted'>
                                <Link href={`/admin/users/system/${user._id}/edit`}>
                                  <Eye className='h-3.5 w-3.5' />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View system user</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}