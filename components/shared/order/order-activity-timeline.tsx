'use client'

import { formatDateTime } from '@/lib/utils'
import { CalendarIcon, CheckCircleIcon, TruckIcon, PackageIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface TimelineEvent {
  label: string
  date: Date | string | null | undefined
  completed: boolean
  description?: string
}

interface OrderActivityTimelineProps {
  createdAt: Date | string
  paidAt?: Date | string | null
  deliveredAt?: Date | string | null
  expectedDeliveryDate?: Date | string | null
  isPaid: boolean
  isDelivered: boolean
}

export default function OrderActivityTimeline({
  createdAt,
  paidAt,
  deliveredAt,
  expectedDeliveryDate,
  isPaid,
  isDelivered,
}: OrderActivityTimelineProps) {
  const events: TimelineEvent[] = [
    {
      label: 'Order Placed',
      date: createdAt,
      completed: true,
      description: 'Order created and submitted',
    },
    {
      label: 'Payment Confirmed',
      date: paidAt,
      completed: isPaid,
      description: isPaid ? 'Payment received' : 'Awaiting payment',
    },
    {
      label: 'Processing',
      date: isPaid && !isDelivered ? paidAt : null,
      completed: isPaid && !isDelivered,
      description: isPaid && !isDelivered ? 'Order is being prepared' : null,
    },
    {
      label: 'Delivered',
      date: deliveredAt,
      completed: isDelivered,
      description: isDelivered ? 'Order delivered to customer' : expectedDeliveryDate ? `Expected: ${formatDateTime(expectedDeliveryDate).dateOnly}` : 'Awaiting delivery',
    },
  ].filter(event => event.label !== 'Processing' || event.completed)

  const getIcon = (index: number) => {
    const icons = [CalendarIcon, CheckCircleIcon, PackageIcon, TruckIcon]
    return icons[index] || CalendarIcon
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-semibold mb-4">Order Timeline</h2>
        <div className="space-y-4">
          {events.map((event, index) => {
            const Icon = getIcon(index)
            const isLast = index === events.length - 1

            return (
              <div key={event.label} className="flex gap-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`rounded-full p-2 ${
                      event.completed
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-muted'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        event.completed
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 h-12 ${
                        event.completed ? 'bg-green-200' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>

                {/* Event details */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-medium ${
                        event.completed
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {event.label}
                    </h3>
                    {event.date && (
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(event.date).dateTime}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
