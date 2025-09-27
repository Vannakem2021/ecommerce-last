'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCartIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  DollarSignIcon,
  TrendingUpIcon,
  PackageIcon
} from 'lucide-react'

interface OrderMetrics {
  totalOrders: number
  paidOrders: number
  unpaidOrders: number
  deliveredOrders: number
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
    paidOrders,
    unpaidOrders,
    deliveredOrders,
    totalRevenue,
    averageOrderValue
  } = metrics

  const cards = [
    {
      title: 'Total Orders',
      value: totalOrders,
      subtitle: 'All Orders',
      icon: ShoppingCartIcon,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      title: 'Paid Orders',
      value: paidOrders,
      subtitle: `${unpaidOrders} Unpaid`,
      icon: CheckCircleIcon,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950'
    },
    {
      title: 'Delivered',
      value: deliveredOrders,
      subtitle: 'Completed Orders',
      icon: PackageIcon,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950'
    },
    {
      title: 'Total Revenue',
      value: `$${(totalRevenue / 1000).toFixed(1)}K`,
      subtitle: `Avg: $${averageOrderValue.toFixed(0)}`,
      icon: DollarSignIcon,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950'
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <Icon className={`h-4 w-4 ${card.iconColor}`} />
                    </div>
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

              {/* Optional trend indicator */}
              {card.title === 'Total Orders' && (
                <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                  <TrendingUpIcon className="h-3 w-3" />
                  <span>+8% this month</span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}