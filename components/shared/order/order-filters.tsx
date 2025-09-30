'use client'

import { useState } from 'react'
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
  DollarSignIcon,
  CalendarIcon,
  CreditCardIcon
} from 'lucide-react'

interface OrderFiltersProps {
  totalResults?: number
  currentRange?: string
  className?: string
}

export interface OrderFilterState {
  status: string
  paymentStatus: string
  dateRange: string
  amountRange: string
}

export default function OrderFilters({
  totalResults = 0,
  currentRange = '',
  className = ''
}: OrderFiltersProps) {
  const [searchValue, setSearchValue] = useState('')
  const [isPending] = useState(false)
  const [filters, setFilters] = useState<OrderFilterState>({
    status: 'all',
    paymentStatus: 'all',
    dateRange: 'all',
    amountRange: 'all'
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    // TODO: Implement search functionality
  }

  const handleFilterChange = (newFilters: OrderFilterState) => {
    setFilters(newFilters)
    // TODO: Implement filter functionality
  }

  const statuses = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'delivered', label: 'Delivered' }
  ]

  const paymentStatuses = [
    { value: 'all', label: 'All Payments' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'refunded', label: 'Refunded' }
  ]

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ]

  const amountRanges = [
    { value: 'all', label: 'All Amounts' },
    { value: '0-50', label: '$0 - $50' },
    { value: '50-100', label: '$50 - $100' },
    { value: '100-500', label: '$100 - $500' },
    { value: '500+', label: '$500+' }
  ]

  const handleSingleFilterChange = (key: keyof OrderFilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    handleFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    const resetFilters = {
      status: 'all',
      paymentStatus: 'all',
      dateRange: 'all',
      amountRange: 'all'
    }
    setFilters(resetFilters)
    handleFilterChange(resetFilters)
    handleSearchChange('')
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

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <ShoppingCartIcon className="h-3 w-3" />
                  Status
                </label>
                <Select value={filters.status} onValueChange={(value) => handleSingleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <CreditCardIcon className="h-3 w-3" />
                  Payment
                </label>
                <Select value={filters.paymentStatus} onValueChange={(value) => handleSingleFilterChange('paymentStatus', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
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
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <DollarSignIcon className="h-3 w-3" />
                  Amount Range
                </label>
                <Select value={filters.amountRange} onValueChange={(value) => handleSingleFilterChange('amountRange', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {amountRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
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