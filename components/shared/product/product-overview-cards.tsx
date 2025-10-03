'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  PackageIcon,
  XCircleIcon,
  ClockIcon,
  DollarSignIcon
} from 'lucide-react'

interface ProductMetrics {
  totalProducts: number
  publishedProducts: number
  draftProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalValue: number
  avgRating: number
  totalRevenue?: number
}

interface ProductOverviewCardsProps {
  metrics: ProductMetrics
  className?: string
}

export default function ProductOverviewCards({ metrics, className = '' }: ProductOverviewCardsProps) {
  const {
    totalProducts,
    outOfStockCount,
    lowStockCount,
    totalValue
  } = metrics

  const cards = [
    {
      title: 'Total Products',
      value: totalProducts,
      subtitle: 'All Categories',
      icon: PackageIcon,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      badge: null
    },
    {
      title: 'Out of Stock',
      value: outOfStockCount,
      subtitle: 'Needs Urgent Restock',
      icon: XCircleIcon,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950',
      badge: outOfStockCount > 0 ? 'URGENT' : null,
      badgeVariant: 'destructive' as const
    },
    {
      title: 'Low Stock',
      value: lowStockCount,
      subtitle: 'Restock Soon (1-10)',
      icon: ClockIcon,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      badge: lowStockCount > 0 ? 'Action Required' : null,
      badgeVariant: 'default' as const
    },
    {
      title: 'Inventory Value',
      value: `$${(totalValue / 1000).toFixed(1)}K`,
      subtitle: 'Current Stock',
      icon: DollarSignIcon,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
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
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        card.badgeVariant === 'destructive' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                      }`}>
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