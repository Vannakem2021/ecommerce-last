'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FolderIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrendingUpIcon,
  BarChart3Icon,
  TagIcon
} from 'lucide-react'

interface CategoryMetrics {
  totalCategories: number
  activeCategories: number
  inactiveCategories: number
  totalProducts: number
  averageProductsPerCategory: number
  mostPopularCategory?: string
}

interface CategoryOverviewCardsProps {
  metrics: CategoryMetrics
  className?: string
}

export default function CategoryOverviewCards({ metrics, className = '' }: CategoryOverviewCardsProps) {
  const {
    totalCategories,
    activeCategories,
    inactiveCategories,
    totalProducts,
    averageProductsPerCategory,
    mostPopularCategory
  } = metrics

  const cards = [
    {
      title: 'Total Categories',
      value: totalCategories,
      subtitle: 'All Categories',
      icon: FolderIcon,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      title: 'Active Categories',
      value: activeCategories,
      subtitle: `${inactiveCategories} Inactive`,
      icon: CheckCircleIcon,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950'
    },
    {
      title: 'Inactive Categories',
      value: inactiveCategories,
      subtitle: 'Not Published',
      icon: XCircleIcon,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      alert: inactiveCategories > 0
    },
    {
      title: 'Total Products',
      value: totalProducts,
      subtitle: `Avg: ${averageProductsPerCategory.toFixed(1)} per category`,
      icon: TagIcon,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950'
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
                      <Badge variant="secondary" className="text-xs">
                        Review
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
              {card.title === 'Total Categories' && (
                <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                  <TrendingUpIcon className="h-3 w-3" />
                  <span>+2 this month</span>
                </div>
              )}

              {/* Most popular category indicator */}
              {card.title === 'Total Products' && mostPopularCategory && (
                <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
                  <BarChart3Icon className="h-3 w-3" />
                  <span>Top: {mostPopularCategory}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}