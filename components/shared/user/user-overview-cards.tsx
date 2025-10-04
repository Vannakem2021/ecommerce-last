'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  UsersIcon,
  UserCheckIcon,
  CalendarIcon,
  ShieldIcon,
  CrownIcon,
  UserCogIcon,
  TrophyIcon
} from 'lucide-react'

interface CustomerMetrics {
  totalCustomers: number
  activeCustomers: number
  newThisMonth: number
  topCustomer?: string
  topCustomerOrders?: number
}

interface SystemUserMetrics {
  totalSystemUsers: number
  admins: number
  managers: number
}

interface UserOverviewCardsProps {
  type: 'customers' | 'system'
  customerMetrics?: CustomerMetrics
  systemMetrics?: SystemUserMetrics
  className?: string
}

export default function UserOverviewCards({
  type,
  customerMetrics,
  systemMetrics,
  className = ''
}: UserOverviewCardsProps) {

  if (type === 'customers' && customerMetrics) {
    const {
      totalCustomers,
      activeCustomers,
      newThisMonth,
      topCustomer,
      topCustomerOrders
    } = customerMetrics

    const cards = [
      {
        title: 'Total Customers',
        value: totalCustomers,
        subtitle: 'Registered accounts',
        icon: UsersIcon,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950'
      },
      {
        title: 'Email Verified',
        value: activeCustomers,
        subtitle: 'Verified accounts',
        icon: UserCheckIcon,
        iconColor: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950',
        bottomInfo: topCustomer ? (
          <div className="mt-3 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <TrophyIcon className="h-3 w-3" />
              <span className="font-medium">Top Customer</span>
            </div>
            <div className="text-xs text-muted-foreground ml-4">
              {topCustomer} ({topCustomerOrders} orders)
            </div>
          </div>
        ) : null
      },
      {
        title: 'New This Month',
        value: newThisMonth,
        subtitle: 'Last 30 days',
        icon: CalendarIcon,
        iconColor: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-950'
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
                  <div className="space-y-2 w-full">
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
                    {'bottomInfo' in card && card.bottomInfo}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  if (type === 'system' && systemMetrics) {
    const {
      totalSystemUsers,
      admins,
      managers
    } = systemMetrics

    const cards = [
      {
        title: 'System Users',
        value: totalSystemUsers,
        subtitle: 'Staff accounts',
        icon: ShieldIcon,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950'
      },
      {
        title: 'Administrators',
        value: admins,
        subtitle: 'Full access',
        icon: CrownIcon,
        iconColor: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950'
      },
      {
        title: 'Managers',
        value: managers,
        subtitle: 'Limited access',
        icon: UserCogIcon,
        iconColor: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-950'
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

  return null
}