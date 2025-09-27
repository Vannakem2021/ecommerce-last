'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  PackageIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  DollarSignIcon,
  TrendingUpIcon,
  BarChart3Icon
} from 'lucide-react'

interface ProductMetrics {
  totalProducts: number
  publishedProducts: number
  draftProducts: number
  lowStockCount: number
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
    publishedProducts,
    draftProducts,
    lowStockCount,
    totalValue,
    avgRating,
    totalRevenue
  } = metrics

  const cards = [
    {
      title: 'Total Products',
      value: totalProducts,
      subtitle: 'All Categories',
      icon: PackageIcon,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      title: 'Published',
      value: publishedProducts,
      subtitle: `${draftProducts} Drafts`,
      icon: CheckCircleIcon,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950'
    },
    {
      title: 'Low Stock',
      value: lowStockCount,
      subtitle: 'Need Restock',
      icon: AlertTriangleIcon,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      alert: lowStockCount > 0
    },
    {
      title: 'Inventory Value',
      value: `$${(totalValue / 1000).toFixed(1)}K`,
      subtitle: 'Current Stock',
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
                    {card.alert && (
                      <Badge variant="destructive" className="text-xs">
                        Alert
                      </Badge>
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

              {/* Optional trend indicator */}
              {card.title === 'Total Products' && (
                <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                  <TrendingUpIcon className="h-3 w-3" />
                  <span>+5% this month</span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}