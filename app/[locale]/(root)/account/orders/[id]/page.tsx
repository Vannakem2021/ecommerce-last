import { notFound } from 'next/navigation'
import React from 'react'

import { auth } from '@/auth'
import { getOrderById } from '@/lib/actions/order.actions'
import OrderDetailsForm from '@/components/shared/order/order-details-form'
import Link from 'next/link'
import { formatId } from '@/lib/utils'
import { generateOrderNumber } from '@/lib/utils/order-utils'
import { ChevronRight } from 'lucide-react'

export async function generateMetadata(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params
  const order = await getOrderById(params.id)
  
  if (!order) {
    return {
      title: 'Order Not Found',
    }
  }

  return {
    title: `Order ${generateOrderNumber(order._id, order.createdAt!)}`,
  }
}

export default async function OrderDetailsPage(props: {
  params: Promise<{
    id: string
  }>
}) {
  const params = await props.params

  const { id } = params

  const order = await getOrderById(id)
  if (!order) notFound()

  const session = await auth()

  const formattedOrderId = generateOrderNumber(order._id, order.createdAt!)

  return (
    <>
      {/* Breadcrumb - Responsive */}
      <nav className='flex flex-wrap items-center gap-2 text-sm mb-4' aria-label='Breadcrumb'>
        <Link href='/account' className='text-muted-foreground hover:text-foreground transition-colors'>
          <span className='hidden sm:inline'>Your Account</span>
          <span className='sm:hidden'>Account</span>
        </Link>
        <ChevronRight className='w-4 h-4 text-muted-foreground flex-shrink-0' />
        <Link href='/account/orders' className='text-muted-foreground hover:text-foreground transition-colors'>
          <span className='hidden sm:inline'>Your Orders</span>
          <span className='sm:hidden'>Orders</span>
        </Link>
        <ChevronRight className='w-4 h-4 text-muted-foreground flex-shrink-0' />
        <span className='font-medium truncate max-w-[200px] sm:max-w-none' title={formattedOrderId}>
          {formattedOrderId}
        </span>
      </nav>
      
      {/* Page Title */}
      <h1 className='text-2xl sm:text-3xl font-bold py-4 font-mono break-all sm:break-normal'>
        {formattedOrderId}
      </h1>
      
      <OrderDetailsForm
        order={{
          ...order,
          abaLastStatusCheck: order.abaLastStatusCheck ? order.abaLastStatusCheck.toISOString() : undefined,
        } as Parameters<typeof OrderDetailsForm>[0]['order']}
        isAdmin={session?.user?.role?.toLowerCase() === 'admin' || false}
      />
    </>
  )
}
