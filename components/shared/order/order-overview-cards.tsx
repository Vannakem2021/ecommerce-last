'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  ShoppingCartIcon,
  ClockIcon,
  TruckIcon,
  PackageIcon
} from 'lucide-react'

interface OrderMetrics {
  totalOrders: number
  paidOrders: number
  unpaidOrders: number
  deliveredOrders: number
  processingOrders: number
  totalRevenue: number
  averageOrderValue: number
}

interface OrderOverviewCardsProps {
  metrics: OrderMetrics
  className?: string
}

export default function OrderOverviewCards({ metrics, className = '' }: OrderOverviewCardsProps) {
  const {
    totalOrders,
    unpaidOrders,
    processingOrders,
    deliveredOrders,
  } = metrics

  const cards = [
    {
      title: 'Total Orders',
      value: totalOrders,
      subtitle: 'All Orders',
      icon: ShoppingCartIcon,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      badge: null
    },
    {
      title: 'Awaiting Payment',
      value: unpaidOrders,
      subtitle: 'Needs Payment',
      icon: ClockIcon,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      badge: unpaidOrders > 0 ? 'Action Required' : null
    },
    {
      title: 'Processing',
      value: processingOrders,
      subtitle: 'Ready to Ship',
      icon: PackageIcon,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      badge: processingOrders > 0 ? 'Ready' : null
    },
    {
      title: 'Delivered',
      value: deliveredOrders,
      subtitle: 'Completed',
      icon: TruckIcon,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      badge: null
    }
  ]

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ${className}`}>
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <Icon className={`h-4 w-4 ${card.iconColor}`} />
                    </div>
                    {card.badge && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {card.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {card.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {card.subtitle}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}