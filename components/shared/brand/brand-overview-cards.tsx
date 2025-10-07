'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TagIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react'

interface BrandMetrics {
  totalBrands: number
  activeBrands: number
  inactiveBrands: number
}

interface BrandOverviewCardsProps {
  metrics: BrandMetrics
  className?: string
}

export default function BrandOverviewCards({ metrics, className = '' }: BrandOverviewCardsProps) {
  const {
    totalBrands,
    activeBrands,
    inactiveBrands
  } = metrics

  const cards = [
    {
      title: 'Total Brands',
      value: totalBrands,
      subtitle: 'All Brand Partners',
      icon: TagIcon,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      title: 'Active Brands',
      value: activeBrands,
      subtitle: `${inactiveBrands} Inactive`,
      icon: CheckCircleIcon,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950'
    },
    {
      title: 'Inactive Brands',
      value: inactiveBrands,
      subtitle: 'Not Published',
      icon: XCircleIcon,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      alert: inactiveBrands > 0
    }
  ]

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${className}`}>
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


            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}