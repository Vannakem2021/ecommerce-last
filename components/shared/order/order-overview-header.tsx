'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { generateOrderNumber } from '@/lib/utils/order-utils'
import { IOrder } from '@/lib/db/models/order.model'
import {
  CalendarIcon,
  PackageIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon
} from 'lucide-react'
import ProductPrice from '../product/product-price'

interface OrderOverviewHeaderProps {
  order: IOrder
}

export default function OrderOverviewHeader({ order }: OrderOverviewHeaderProps) {
  const orderNumber = generateOrderNumber(order._id, order.createdAt!)
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0)

  // Status indicator component
  const StatusIndicator = () => {
    if (order.isDelivered) {
      return (
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-green-600" />
          <div>
            <Badge className="bg-green-600 hover:bg-green-700">Delivered</Badge>
            <div className="text-sm text-muted-foreground mt-1">
              {formatDateTime(order.deliveredAt!).dateTime}
            </div>
          </div>
        </div>
      )
    }

    if (order.isPaid) {
      return (
        <div className="flex items-center gap-2">
          <TruckIcon className="h-5 w-5 text-blue-600" />
          <div>
            <Badge className="bg-blue-600 hover:bg-blue-700">Paid & Processing</Badge>
            <div className="text-sm text-muted-foreground mt-1">
              Paid: {formatDateTime(order.paidAt!).dateTime}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <ClockIcon className="h-5 w-5 text-amber-600" />
        <div>
          <Badge variant="destructive">Payment Pending</Badge>
          <div className="text-sm text-muted-foreground mt-1">
            Created: {formatDateTime(order.createdAt!).dateTime}
          </div>
        </div>
      </div>
    )
  }

  // Timeline component
  const OrderTimeline = () => {
    const events = [
      {
        label: 'Created',
        date: order.createdAt!,
        completed: true,
        icon: CalendarIcon
      },
      {
        label: 'Paid',
        date: order.paidAt,
        completed: order.isPaid,
        icon: CheckCircleIcon
      },
      {
        label: 'Delivered',
        date: order.deliveredAt,
        completed: order.isDelivered,
        icon: TruckIcon
      }
    ]

    return (
      <div className="space-y-2">
        {events.map((event) => {
          const Icon = event.icon
          return (
            <div key={event.label} className="flex items-center gap-2 text-sm">
              <Icon
                className={`h-4 w-4 ${
                  event.completed
                    ? 'text-green-600'
                    : 'text-muted-foreground'
                }`}
              />
              <span className={event.completed ? 'text-foreground' : 'text-muted-foreground'}>
                {event.label}
              </span>
              {event.date && (
                <span className="text-muted-foreground text-xs">
                  {formatDateTime(event.date).dateOnly}
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Order Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <PackageIcon className="h-4 w-4" />
              <span>Order Info</span>
            </div>
            <div>
              <div className="font-semibold text-lg">{orderNumber}</div>
              <div className="text-2xl font-bold">
                <ProductPrice price={order.totalPrice} plain />
              </div>
              <div className="text-sm text-muted-foreground">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Customer</span>
            </div>
            <div>
              <div className="font-semibold">
                {typeof order.user === 'object' && order.user ? order.user.name : 'Guest Customer'}
              </div>
              {typeof order.user === 'object' && order.user?.email && (
                <div className="text-sm text-muted-foreground">
                  {order.user.email}
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                {order.shippingAddress.phone}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Status</span>
            </div>
            <StatusIndicator />
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Timeline</span>
            </div>
            <OrderTimeline />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}