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
  UsersIcon,
  CalendarIcon,
  SortAscIcon,
  ShoppingCartIcon,
  ShieldIcon,
  ClockIcon
} from 'lucide-react'

interface UserFiltersProps {
  type: 'customers' | 'system'
  totalResults?: number
  currentRange?: string
  className?: string
}

export interface CustomerFilterState {
  status: string
  registrationPeriod: string
  orderStatus: string
  sort: string
}

export interface SystemUserFilterState {
  role: string
  status: string
  loginActivity: string
  sort: string
}

export default function UserFilters({
  type,
  totalResults = 0,
  currentRange = '',
  className = ''
}: UserFiltersProps) {
  const [searchValue, setSearchValue] = useState('')
  const [isPending] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Customer filters
  const [customerFilters, setCustomerFilters] = useState<CustomerFilterState>({
    status: 'all',
    registrationPeriod: 'all',
    orderStatus: 'all',
    sort: 'latest'
  })

  // System user filters
  const [systemFilters, setSystemFilters] = useState<SystemUserFilterState>({
    role: 'all',
    status: 'all',
    loginActivity: 'all',
    sort: 'latest'
  })

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    // TODO: Implement search functionality
  }

  const handleCustomerFilterChange = (newFilters: CustomerFilterState) => {
    setCustomerFilters(newFilters)
    // TODO: Implement filter functionality
  }

  const handleSystemFilterChange = (newFilters: SystemUserFilterState) => {
    setSystemFilters(newFilters)
    // TODO: Implement filter functionality
  }

  // Customer filter options
  const customerStatusOptions = [
    { value: 'all', label: 'All Customers' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'verified', label: 'Email Verified' }
  ]

  const registrationPeriodOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ]

  const customerOrderStatusOptions = [
    { value: 'all', label: 'All' },
    { value: 'has-orders', label: 'Has Orders' },
    { value: 'no-orders', label: 'No Orders' },
    { value: 'recent-buyer', label: 'Recent Buyer' }
  ]

  const customerSortOptions = [
    { value: 'latest', label: 'Latest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'orders-high', label: 'Most Orders' },
    { value: 'orders-low', label: 'Least Orders' }
  ]

  // System user filter options
  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Administrators' },
    { value: 'manager', label: 'Managers' },
    { value: 'seller', label: 'Sellers' }
  ]

  const systemStatusOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending Approval' }
  ]

  const loginActivityOptions = [
    { value: 'all', label: 'All Activity' },
    { value: 'recent', label: 'Recent Login' },
    { value: 'inactive', label: 'Inactive Users' },
    { value: 'never', label: 'Never Logged In' }
  ]

  const systemSortOptions = [
    { value: 'latest', label: 'Latest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'role', label: 'By Role' },
    { value: 'last-login', label: 'Last Login' }
  ]

  const currentFilters = type === 'customers' ? customerFilters : systemFilters
  const activeFiltersCount = Object.values(currentFilters).filter(value => value !== 'all' && value !== 'latest').length + (searchValue ? 1 : 0)

  const clearAllFilters = () => {
    if (type === 'customers') {
      const resetFilters = {
        status: 'all',
        registrationPeriod: 'all',
        orderStatus: 'all',
        sort: 'latest'
      }
      setCustomerFilters(resetFilters)
      handleCustomerFilterChange(resetFilters)
    } else {
      const resetFilters = {
        role: 'all',
        status: 'all',
        loginActivity: 'all',
        sort: 'latest'
      }
      setSystemFilters(resetFilters)
      handleSystemFilterChange(resetFilters)
    }
    handleSearchChange('')
  }

  const handleSingleFilterChange = (key: string, value: string) => {
    if (type === 'customers') {
      const newFilters = { ...customerFilters, [key]: value }
      setCustomerFilters(newFilters)
      handleCustomerFilterChange(newFilters)
    } else {
      const newFilters = { ...systemFilters, [key]: value }
      setSystemFilters(newFilters)
      handleSystemFilterChange(newFilters)
    }
  }

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
              placeholder={type === 'customers' ? 'Search customers by name or email...' : 'Search system users by name or email...'}
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
                {totalResults === 1 ? ` ${type === 'customers' ? 'customer' : 'user'}` : ` ${type === 'customers' ? 'customers' : 'users'}`}
              </span>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t pt-4">
            {type === 'customers' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Customer Status Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <UsersIcon className="h-3 w-3" />
                    Status
                  </label>
                  <Select value={customerFilters.status} onValueChange={(value) => handleSingleFilterChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {customerStatusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Registration Period Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Registration
                  </label>
                  <Select value={customerFilters.registrationPeriod} onValueChange={(value) => handleSingleFilterChange('registrationPeriod', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {registrationPeriodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Order Status Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <ShoppingCartIcon className="h-3 w-3" />
                    Orders
                  </label>
                  <Select value={customerFilters.orderStatus} onValueChange={(value) => handleSingleFilterChange('orderStatus', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {customerOrderStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <SortAscIcon className="h-3 w-3" />
                    Sort By
                  </label>
                  <Select value={customerFilters.sort} onValueChange={(value) => handleSingleFilterChange('sort', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {customerSortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Role Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <ShieldIcon className="h-3 w-3" />
                    Role
                  </label>
                  <Select value={systemFilters.role} onValueChange={(value) => handleSingleFilterChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* System Status Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <UsersIcon className="h-3 w-3" />
                    Status
                  </label>
                  <Select value={systemFilters.status} onValueChange={(value) => handleSingleFilterChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {systemStatusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Login Activity Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    Activity
                  </label>
                  <Select value={systemFilters.loginActivity} onValueChange={(value) => handleSingleFilterChange('loginActivity', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {loginActivityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <SortAscIcon className="h-3 w-3" />
                    Sort By
                  </label>
                  <Select value={systemFilters.sort} onValueChange={(value) => handleSingleFilterChange('sort', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {systemSortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}