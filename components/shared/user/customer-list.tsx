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
import { deleteUser } from '@/lib/actions/user.actions'
import { IUser } from '@/lib/db/models/user.model'
import { formatDateTime } from '@/lib/utils'
import { Edit, UserIcon, ShoppingCartIcon, MailIcon, CalendarIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'
import { useTransition } from 'react'
import { useToast } from '@/hooks/use-toast'
import DeleteDialog from '@/components/shared/delete-dialog'

interface CustomerWithStats extends IUser {
  canEdit?: boolean
  canDelete?: boolean
  totalOrders?: number
  lastOrderDate?: Date
  isEmailVerified?: boolean
}

export default function CustomerList({
  data,
  totalCustomers,
  page,
  totalPages,
}: {
  data: CustomerWithStats[]
  totalCustomers: number
  page: number
  totalPages: number
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const res = await deleteUser(id)
      if (res.success) {
        toast({
          description: res.message,
        })
      } else {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      }
    })
  }

  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow className='bg-muted/30 hover:bg-muted/50 border-b'>
            <TableHead className='font-semibold text-foreground'>CUSTOMER</TableHead>
            <TableHead className='font-semibold text-foreground'>EMAIL STATUS</TableHead>
            <TableHead className='font-semibold text-foreground'>ORDERS</TableHead>
            <TableHead className='font-semibold text-foreground'>JOINED</TableHead>
            <TableHead className='w-[100px] font-semibold text-foreground'>ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className='text-center py-8 text-muted-foreground'>
                <div className='flex flex-col items-center gap-2'>
                  <UserIcon className='h-8 w-8 text-muted-foreground/50' />
                  <p>No customers found</p>
                  <p className='text-sm'>Customers will appear here when they register</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((customer) => (
              <TableRow key={customer._id} className='hover:bg-muted/30 transition-colors border-b border-border/50'>
                <TableCell className='py-3'>
                  <div className='flex items-center gap-3'>
                    <div className='p-1.5 rounded-md bg-blue-50 dark:bg-blue-950'>
                      <UserIcon className='h-3.5 w-3.5 text-blue-600' />
                    </div>
                    <div>
                      <div className='font-medium text-foreground'>{customer.name}</div>
                      <div className='text-sm text-muted-foreground'>{customer.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className='py-3'>
                  <div className='flex items-center gap-2'>
                    <MailIcon className='h-3.5 w-3.5 text-muted-foreground' />
                    <Badge
                      variant={customer.isEmailVerified !== false ? 'default' : 'secondary'}
                      className={customer.isEmailVerified !== false ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                    >
                      {customer.isEmailVerified !== false ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className='py-3'>
                  <div className='flex items-center gap-2'>
                    <ShoppingCartIcon className='h-3.5 w-3.5 text-muted-foreground' />
                    <div>
                      <div className='font-medium'>{customer.totalOrders || 0} orders</div>
                      {customer.lastOrderDate && (
                        <div className='text-xs text-muted-foreground'>
                          Last: {formatDateTime(customer.lastOrderDate).dateOnly}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className='py-3'>
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <CalendarIcon className='h-3.5 w-3.5' />
                    <div className='text-sm'>
                      {formatDateTime(customer.createdAt).dateOnly}
                    </div>
                  </div>
                </TableCell>
                <TableCell className='py-3'>
                  <div className='flex items-center gap-1'>
                    {customer.canEdit && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild variant='ghost' size='sm' className='h-8 w-8 p-0 hover:bg-muted'>
                              <Link href={`/admin/users/customers/${customer._id}/edit`}>
                                <Edit className='h-3.5 w-3.5' />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit customer</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {customer.canDelete && (
                      <DeleteDialog id={customer._id} action={handleDelete} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}