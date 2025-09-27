'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type FilterStatus = 'all' | 'paid' | 'unpaid' | 'delivered' | 'pending'

interface OrderStatusFiltersProps {
  onFilterChange?: (status: FilterStatus) => void
  totalOrders: number
  paidOrders: number
}

export default function OrderStatusFilters({
  onFilterChange,
  totalOrders,
  paidOrders
}: OrderStatusFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all')

  const handleFilterClick = (status: FilterStatus) => {
    setActiveFilter(status)
    onFilterChange?.(status)
  }

  const unpaidOrders = totalOrders - paidOrders

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2 mr-4">
        <span className="text-sm font-medium">Filter by status:</span>
      </div>

      <Button
        variant={activeFilter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleFilterClick('all')}
        className={cn(
          "transition-all",
          activeFilter === 'all' && "shadow-md"
        )}
      >
        All Orders
        <Badge variant="secondary" className="ml-2">
          {totalOrders}
        </Badge>
      </Button>

      <Button
        variant={activeFilter === 'paid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleFilterClick('paid')}
        className={cn(
          "transition-all",
          activeFilter === 'paid' && "shadow-md bg-blue-600 hover:bg-blue-700"
        )}
      >
        Paid
        <Badge variant="secondary" className="ml-2">
          {paidOrders}
        </Badge>
      </Button>

      <Button
        variant={activeFilter === 'unpaid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleFilterClick('unpaid')}
        className={cn(
          "transition-all",
          activeFilter === 'unpaid' && "shadow-md bg-red-600 hover:bg-red-700"
        )}
      >
        Unpaid
        <Badge variant="secondary" className="ml-2">
          {unpaidOrders}
        </Badge>
      </Button>

      <Button
        variant={activeFilter === 'delivered' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleFilterClick('delivered')}
        className={cn(
          "transition-all",
          activeFilter === 'delivered' && "shadow-md bg-green-600 hover:bg-green-700"
        )}
      >
        Delivered
        <Badge variant="secondary" className="ml-2">
          ?
        </Badge>
      </Button>

      <Button
        variant={activeFilter === 'pending' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleFilterClick('pending')}
        className={cn(
          "transition-all",
          activeFilter === 'pending' && "shadow-md bg-yellow-600 hover:bg-yellow-700"
        )}
      >
        Pending Payment
        <Badge variant="secondary" className="ml-2">
          {totalOrders - paidOrders}
        </Badge>
      </Button>
    </div>
  )
}