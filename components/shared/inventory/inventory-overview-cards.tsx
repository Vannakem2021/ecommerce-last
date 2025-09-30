'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  PackageIcon,
  AlertTriangleIcon,
  XCircleIcon,
  DollarSignIcon,
  TrendingUpIcon,
  BarChart3Icon
} from 'lucide-react'

interface InventoryMetrics {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalInventoryValue: number
  averageStockLevel: number
  inStockCount: number
}

interface InventoryOverviewCardsProps {
  metrics: InventoryMetrics
  className?: string
}

export default function InventoryOverviewCards({ metrics, className = '' }: InventoryOverviewCardsProps) {
  const {
    totalProducts,
    lowStockCount,
    outOfStockCount,
    totalInventoryValue,
    averageStockLevel
  } = metrics

  const cards = [
    {
      title: 'Total Products',
      value: totalProducts,
      subtitle: 'All Inventory Items',
      icon: PackageIcon,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      title: 'Low Stock',
      value: lowStockCount,
      subtitle: 'Need Restocking',
      icon: AlertTriangleIcon,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      alert: lowStockCount > 0
    },
    {
      title: 'Out of Stock',
      value: outOfStockCount,
      subtitle: 'Unavailable Items',
      icon: XCircleIcon,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950',
      alert: outOfStockCount > 0
    },
    {
      title: 'Inventory Value',
      value: `$${(totalInventoryValue / 1000).toFixed(1)}K`,
      subtitle: `Avg: ${averageStockLevel.toFixed(0)} units`,
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
                  <span>+3 this week</span>
                </div>
              )}

              {/* Stock health indicator */}
              {card.title === 'Low Stock' && lowStockCount === 0 && (
                <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                  <BarChart3Icon className="h-3 w-3" />
                  <span>All stock healthy</span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}