'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  UsersIcon,
  UserCheckIcon,
  TrendingUpIcon,
  ShoppingCartIcon,
  CalendarIcon,
  ShieldIcon,
  CrownIcon,
  UserCogIcon,
  ClockIcon
} from 'lucide-react'

interface CustomerMetrics {
  totalCustomers: number
  activeCustomers: number
  newThisMonth: number
  totalOrders: number
  averageOrderValue: number
  topCustomer?: string
}

interface SystemUserMetrics {
  totalSystemUsers: number
  admins: number
  managers: number
  sellers: number
  recentLogins: number
  pendingApprovals?: number
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
      totalOrders,
      averageOrderValue,
      topCustomer
    } = customerMetrics

    const cards = [
      {
        title: 'Total Customers',
        value: totalCustomers,
        subtitle: 'Registered Users',
        icon: UsersIcon,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950'
      },
      {
        title: 'Active Customers',
        value: activeCustomers,
        subtitle: 'With Recent Orders',
        icon: UserCheckIcon,
        iconColor: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950'
      },
      {
        title: 'New This Month',
        value: newThisMonth,
        subtitle: 'Recent Signups',
        icon: CalendarIcon,
        iconColor: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-950'
      },
      {
        title: 'Total Orders',
        value: totalOrders,
        subtitle: `Avg: $${averageOrderValue.toFixed(0)} per order`,
        icon: ShoppingCartIcon,
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

                {/* Growth indicator for new customers */}
                {card.title === 'New This Month' && newThisMonth > 0 && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                    <TrendingUpIcon className="h-3 w-3" />
                    <span>Growing</span>
                  </div>
                )}

                {/* Top customer indicator */}
                {card.title === 'Total Orders' && topCustomer && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
                    <CrownIcon className="h-3 w-3" />
                    <span>Top: {topCustomer}</span>
                  </div>
                )}
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
      managers,
      sellers,
      recentLogins,
      pendingApprovals
    } = systemMetrics

    const cards = [
      {
        title: 'System Users',
        value: totalSystemUsers,
        subtitle: 'Staff Members',
        icon: ShieldIcon,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950'
      },
      {
        title: 'Administrators',
        value: admins,
        subtitle: 'Full Access',
        icon: CrownIcon,
        iconColor: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950'
      },
      {
        title: 'Managers',
        value: managers,
        subtitle: 'Department Heads',
        icon: UserCogIcon,
        iconColor: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-950'
      },
      {
        title: 'Sales Team',
        value: sellers,
        subtitle: 'Active Sellers',
        icon: UsersIcon,
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
                      {pendingApprovals && pendingApprovals > 0 && card.title === 'System Users' && (
                        <Badge variant="secondary" className="text-xs">
                          {pendingApprovals} Pending
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

                {/* Recent activity for system users */}
                {card.title === 'System Users' && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                    <ClockIcon className="h-3 w-3" />
                    <span>{recentLogins} recent logins</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return null
}