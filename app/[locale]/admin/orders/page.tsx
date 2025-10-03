import { Metadata } from 'next'
import Link from 'next/link'

import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
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
import { getAllOrders } from '@/lib/actions/order.actions'
import { formatDateTime } from '@/lib/utils'
import { IOrderList } from '@/types'
import ProductPrice from '@/components/shared/product/product-price'
import { ViewInvoiceButton } from '@/components/shared/invoice/invoice-actions'
import OrderOverviewCards from '@/components/shared/order/order-overview-cards'
import OrderFilters from '@/components/shared/order/order-filters'
import { ExportOrdersButton } from '@/components/shared/order/export-orders-button'
import { MarkDeliveredDialog } from '@/components/shared/order/mark-delivered-dialog'
import { MarkPaidDialog } from '@/components/shared/order/mark-paid-dialog'
import { Eye, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
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

// Helper component for ORDER FULFILLMENT status badges (not payment status)
const OrderStatusBadge = ({ isPaid, isDelivered, deliveredAt }: {
  isPaid: boolean
  isDelivered: boolean
  deliveredAt?: Date
}) => {
  // Order has been delivered - final state
  if (isDelivered && deliveredAt) {
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="default" className="bg-green-600 hover:bg-green-700 w-fit">
          ✓ Delivered
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatDateTime(deliveredAt).dateTime}
        </span>
      </div>
    )
  }
  
  // Order is paid, awaiting delivery
  if (isPaid) {
    return (
      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 w-fit">
        📦 Processing
      </Badge>
    )
  }
  
  // Order is not paid yet
  return (
    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 w-fit">
      ⏳ Awaiting Payment
    </Badge>
  )
}

export default async function OrdersPage(props: {
  searchParams: Promise<{ 
    page: string
    search?: string
    status?: string
    dateRange?: string
  }>
}) {
  const searchParams = await props.searchParams

  const { 
    page = '1',
    search,
    status,
    dateRange,
  } = searchParams

  const session = await auth()

  if (!session?.user?.role || !hasPermission(session.user.role, 'orders.read')) {
    throw new Error('Insufficient permissions to view orders')
  }

  const orders = await getAllOrders({
    page: Number(page),
    search,
    status,
    dateRange,
  })

  // Calculate order metrics for overview cards (workflow-focused)
  const orderMetrics = {
    totalOrders: orders.totalOrders,
    paidOrders: orders.totalPaidOrders,
    unpaidOrders: orders.totalOrders - orders.totalPaidOrders,
    deliveredOrders: orders.totalDeliveredOrders,
    processingOrders: orders.totalPaidOrders - orders.totalDeliveredOrders, // Paid but not delivered
    totalRevenue: orders.totalRevenue,
    averageOrderValue: orders.totalOrders > 0 ? orders.totalRevenue / orders.totalOrders : 0
  }

  const currentPage = Number(page)
  const startItem = ((currentPage - 1) * 10) + 1
  const endItem = Math.min(currentPage * 10, orders.totalOrders)

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer orders and track deliveries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportOrdersButton
            filters={{
              search,
              status,
              dateRange,
            }}
            totalOrders={orders.totalOrders}
          />
          <Button asChild className="flex items-center gap-2">
            <Link href="/admin/orders/create">
              <Plus className="h-4 w-4" />
              Create Order
            </Link>
          </Button>
        </div>
      </div>

      {/* Order Overview Cards */}
      <OrderOverviewCards metrics={orderMetrics} />

      {/* Advanced Filtering */}
      <OrderFilters
        totalResults={orders.totalOrders}
        currentRange={orders.totalOrders === 0 ? 'No' : `${startItem}-${endItem} of ${orders.totalOrders}`}
      />

      {/* Enhanced Orders Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>ORDER ID</TableHead>
              <TableHead>DATE</TableHead>
              <TableHead>CUSTOMER</TableHead>
              <TableHead className="text-right">TOTAL</TableHead>
              <TableHead>PAYMENT STATUS</TableHead>
              <TableHead>ORDER STATUS</TableHead>
              <TableHead className="w-24 text-center">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.data.map((order: IOrderList) => (
              <TableRow key={order._id} className="hover:bg-muted/30 transition-colors">
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
                <TableCell className="text-right font-semibold">
                  <ProductPrice price={order.totalPrice} plain />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={order.isPaid ? "default" : "destructive"}
                    className={order.isPaid ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {order.isPaid ? "Paid" : "Unpaid"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <OrderStatusBadge
                    isPaid={order.isPaid}
                    isDelivered={order.isDelivered}
                    deliveredAt={order.deliveredAt}
                  />
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Link href={`/admin/orders/${order._id}`}>
                              <Eye className="h-3 w-3" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View order details</TooltipContent>
                      </Tooltip>

                      {!order.isPaid && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <MarkPaidDialog
                                orderId={order._id}
                                orderNumber={generateOrderNumber(order._id, order.createdAt!)}
                                customerName={order.user?.name || 'Customer'}
                                totalPrice={order.totalPrice}
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                showLabel={false}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Mark as Paid</TooltipContent>
                        </Tooltip>
                      )}

                      {order.isPaid && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <ViewInvoiceButton
                              orderId={order._id}
                              variant="outline"
                              size="sm"
                              isAdmin={true}
                              className="h-8 w-8 p-0"
                            />
                          </TooltipTrigger>
                          <TooltipContent>Download invoice</TooltipContent>
                        </Tooltip>
                      )}

                      {order.isPaid && !order.isDelivered && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <MarkDeliveredDialog
                                orderId={order._id}
                                orderNumber={generateOrderNumber(order._id, order.createdAt!)}
                                customerName={order.user?.name || 'Customer'}
                                totalPrice={order.totalPrice}
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                showLabel={false}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Mark as Delivered</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Enhanced Pagination */}
        {orders.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {startItem} to {endItem} of {orders.totalOrders} orders
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                disabled={currentPage <= 1}
              >
                <Link
                  href={currentPage <= 1 ? '#' : `?page=${currentPage - 1}`}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {orders.totalPages}
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                disabled={currentPage >= orders.totalPages}
              >
                <Link
                  href={currentPage >= orders.totalPages ? '#' : `?page=${currentPage + 1}`}
                  className={currentPage >= orders.totalPages ? 'pointer-events-none opacity-50' : ''}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
