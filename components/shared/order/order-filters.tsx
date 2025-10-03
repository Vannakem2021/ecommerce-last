'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  SearchIcon,
  FilterIcon,
  XIcon,
  ShoppingCartIcon,
  CalendarIcon,
} from 'lucide-react'

interface OrderFiltersProps {
  totalResults?: number
  currentRange?: string
  className?: string
}

export interface OrderFilterState {
  status: string
  dateRange: string
}

export default function OrderFilters({
  totalResults = 0,
  currentRange = '',
  className = ''
}: OrderFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Initialize from URL params
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState<OrderFilterState>({
    status: searchParams.get('status') || 'all',
    dateRange: searchParams.get('dateRange') || 'all',
  })

  const [showAdvanced, setShowAdvanced] = useState(
    filters.status !== 'all' || 
    filters.dateRange !== 'all'
  )

  // Update URL with current filters
  const updateURL = (newFilters: OrderFilterState, newSearch: string) => {
    const params = new URLSearchParams()
    
    if (newSearch) params.set('search', newSearch)
    if (newFilters.status !== 'all') params.set('status', newFilters.status)
    if (newFilters.dateRange !== 'all') params.set('dateRange', newFilters.dateRange)
    
    // Keep page param if it exists
    const currentPage = searchParams.get('page')
    if (currentPage && currentPage !== '1') {
      params.set('page', currentPage)
    }

    startTransition(() => {
      router.push(`/admin/orders?${params.toString()}`)
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURL(filters, searchValue)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchValue])

  const handleFilterChange = (newFilters: OrderFilterState) => {
    setFilters(newFilters)
    updateURL(newFilters, searchValue)
  }

  const statuses = [
    { value: 'all', label: 'All Orders', icon: '📦' },
    { value: 'pending', label: 'Pending Payment', icon: '⏳' },
    { value: 'paid', label: 'Paid', icon: '✅' },
    { value: 'delivered', label: 'Delivered', icon: '🚚' }
  ]

  const dateRanges = [
    { value: 'all', label: 'All Time', icon: '📅' },
    { value: 'today', label: 'Today', icon: '📆' },
    { value: 'last7days', label: 'Last 7 Days', icon: '📅' },
    { value: 'last30days', label: 'Last 30 Days', icon: '📅' },
    { value: 'thisMonth', label: 'This Month', icon: '📅' },
    { value: 'lastMonth', label: 'Last Month', icon: '📅' }
  ]

  const handleSingleFilterChange = (key: keyof OrderFilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    handleFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    const resetFilters = {
      status: 'all',
      dateRange: 'all',
    }
    setFilters(resetFilters)
    setSearchValue('')
    handleFilterChange(resetFilters)
  }

  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all').length + (searchValue ? 1 : 0)

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {/* Primary Search and Results */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex-1 min-w-[300px] relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search orders by order ID, customer name, or email..."
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              <FilterIcon className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <XIcon className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div>
            {isPending ? (
              <span>Loading...</span>
            ) : (
              <span>
                {totalResults === 0 ? 'No' : currentRange}
                {totalResults === 1 ? ' result' : ' results'}
              </span>
            )}
          </div>
        </div>

        {/* Simplified Filters */}
        {showAdvanced && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <ShoppingCartIcon className="h-3 w-3" />
                  Order Status
                </label>
                <Select value={filters.status} onValueChange={(value) => handleSingleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <span className="flex items-center gap-2">
                          <span>{status.icon}</span>
                          <span>{status.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Date Range
                </label>
                <Select value={filters.dateRange} onValueChange={(value) => handleSingleFilterChange('dateRange', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        <span className="flex items-center gap-2">
                          <span>{range.icon}</span>
                          <span>{range.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}