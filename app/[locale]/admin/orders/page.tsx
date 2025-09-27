import { Metadata } from 'next'
import Link from 'next/link'

import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import DeleteDialog from '@/components/shared/delete-dialog'
import Pagination from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { deleteOrder, getAllOrders } from '@/lib/actions/order.actions'
import { formatDateTime, formatId } from '@/lib/utils'
import { IOrderList } from '@/types'
import ProductPrice from '@/components/shared/product/product-price'
import { ViewInvoiceButton } from '@/components/shared/invoice/invoice-actions'
import BulkInvoiceActions from '@/components/shared/invoice/bulk-invoice-actions'
import OrderStatusFilters from '@/components/admin/order-status-filters'
import { Eye, NotebookText, Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export const metadata: Metadata = {
  title: 'Admin Orders',
}
// Helper function to generate user-friendly order numbers
const generateOrderNumber = (id: string, createdAt: Date) => {
  const date = new Date(createdAt)
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const shortId = id.slice(-4).toUpperCase()
  return `ORD-${year}${month}${day}-${shortId}`
}

// Helper component for status badges
const StatusBadge = ({ isPaid, isDelivered, paidAt, deliveredAt }: {
  isPaid: boolean
  isDelivered: boolean
  paidAt?: Date
  deliveredAt?: Date
}) => {
  if (isDelivered && deliveredAt) {
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="default" className="bg-green-600 hover:bg-green-700 w-fit">
          Delivered
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatDateTime(deliveredAt).dateTime}
        </span>
      </div>
    )
  }
  if (isPaid && paidAt) {
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 w-fit">
          Paid
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatDateTime(paidAt).dateTime}
        </span>
      </div>
    )
  }
  return (
    <Badge variant="destructive" className="w-fit">
      Unpaid
    </Badge>
  )
}

export default async function OrdersPage(props: {
  searchParams: Promise<{ page: string }>
}) {
  const searchParams = await props.searchParams

  const { page = '1' } = searchParams

  const session = await auth()

  if (!session?.user?.role || !hasPermission(session.user.role, 'orders.read')) {
    throw new Error('Insufficient permissions to view orders')
  }

  const orders = await getAllOrders({
    page: Number(page),
  })

  return (
    <div className='space-y-4'>
      <h1 className='h1-bold'>Orders</h1>

      {/* Bulk Invoice Management */}
      <BulkInvoiceActions
        totalOrders={orders.totalOrders}
        paidOrders={orders.totalPaidOrders}
      />

      {/* Status Filters */}
      <OrderStatusFilters
        totalOrders={orders.totalOrders}
        paidOrders={orders.totalPaidOrders}
      />

      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ORDER ID</TableHead>
              <TableHead>DATE</TableHead>
              <TableHead>BUYER</TableHead>
              <TableHead>TOTAL</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.data.map((order: IOrderList) => (
              <TableRow key={order._id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-mono text-sm">
                  <span className="font-semibold" title={order._id}>
                    {generateOrderNumber(order._id, order.createdAt!)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {formatDateTime(order.createdAt!).dateOnly}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(order.createdAt!).timeOnly}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {order.user ? order.user.name : 'Deleted User'}
                </TableCell>
                <TableCell>
                  <ProductPrice price={order.totalPrice} plain />
                </TableCell>
                <TableCell>
                  <StatusBadge
                    isPaid={order.isPaid}
                    isDelivered={order.isDelivered}
                    paidAt={order.paidAt}
                    deliveredAt={order.deliveredAt}
                  />
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <div className='flex gap-2 items-center'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant='outline' size='sm' className='hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'>
                            <Link href={`/admin/orders/${order._id}`}>
                              <Eye className='h-4 w-4 mr-1' />
                              <span className='text-xs uppercase'>DETAILS</span>
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View order details and items</p>
                        </TooltipContent>
                      </Tooltip>

                      {order.isPaid && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <ViewInvoiceButton
                              orderId={order._id}
                              variant="outline"
                              size="sm"
                              isAdmin={true}
                              className='hover:bg-green-50 hover:border-green-300 hover:text-green-700'
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download invoice PDF</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DeleteDialog id={order._id} action={deleteOrder} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete this order permanently</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {orders.totalPages > 1 && (
          <Pagination page={page} totalPages={orders.totalPages!} />
        )}
      </div>
    </div>
  )
}
