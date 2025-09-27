import { notFound } from 'next/navigation'
import React from 'react'

import { auth } from '@/auth'
import { getOrderById } from '@/lib/actions/order.actions'
import OrderDetailsForm from '@/components/shared/order/order-details-form'
import OrderOverviewHeader from '@/components/shared/order/order-overview-header'
import { generateInvoiceNumber } from '@/lib/utils/invoice-utils'
import { generateOrderNumber } from '@/lib/utils/order-utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from 'lucide-react'

export const metadata = {
  title: 'Admin Order Details',
}

const AdminOrderDetailsPage = async (props: {
  params: Promise<{
    id: string
  }>
}) => {
  const params = await props.params

  const { id } = params

  const order = await getOrderById(id)
  if (!order) notFound()

  const session = await auth()
  const orderNumber = generateOrderNumber(order._id, order.createdAt!)

  return (
    <main className='max-w-7xl mx-auto p-4 space-y-6'>
      {/* Enhanced Breadcrumb Navigation */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Button variant="ghost" size="sm" asChild>
            <Link href='/admin/orders' className="flex items-center gap-2">
              <ArrowLeftIcon className="h-4 w-4" />
              Orders
            </Link>
          </Button>
          <span className='text-muted-foreground'>›</span>
          <span className="font-semibold">{orderNumber}</span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {order.isPaid && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/orders/${order._id}/invoice`} target="_blank">
                  View Invoice
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Order Overview Header */}
      <OrderOverviewHeader order={order} />

      {/* Main Content */}
      <OrderDetailsForm
        order={order}
        isAdmin={session?.user?.role === 'Admin' || false}
      />
    </main>
  )
}

export default AdminOrderDetailsPage
