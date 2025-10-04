'use client'

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
import { SearchIcon, XIcon } from 'lucide-react'

interface UserFiltersProps {
  type: 'customers' | 'system'
  searchValue: string
  onSearchChange: (value: string) => void
  emailFilter?: string
  onEmailFilterChange?: (value: string) => void
  roleFilter?: string
  onRoleFilterChange?: (value: string) => void
  sort: string
  onSortChange: (value: string) => void
  totalResults?: number
  currentRange?: string
  onClearFilters: () => void
}

export default function UserFilters({
  type,
  searchValue,
  onSearchChange,
  emailFilter,
  onEmailFilterChange,
  roleFilter,
  onRoleFilterChange,
  sort,
  onSortChange,
  totalResults = 0,
  currentRange = '',
  onClearFilters
}: UserFiltersProps) {

  // Count active filters
  const activeFiltersCount = 
    (searchValue ? 1 : 0) +
    ((emailFilter && emailFilter !== 'all') ? 1 : 0) +
    ((roleFilter && roleFilter !== 'all') ? 1 : 0) +
    (sort !== 'latest' ? 1 : 0)

  return (
    <Card>
      <CardContent className="p-4">
        {/* Search Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex-1 min-w-[300px] relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={type === 'customers' ? 'Search by name or email...' : 'Search by name or email...'}
              className="pl-10"
            />
          </div>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-4 w-4 mr-1" />
              Clear All
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            </Button>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div>
            <span>
              {totalResults === 0 ? 'No' : currentRange}
              {totalResults === 1 ? ` ${type === 'customers' ? 'customer' : 'user'}` : ` ${type === 'customers' ? 'customers' : 'users'}`}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Customer-specific: Email Verified Filter */}
          {type === 'customers' && onEmailFilterChange && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Email Status
              </label>
              <Select value={emailFilter} onValueChange={onEmailFilterChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="verified">Email Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* System User-specific: Role Filter */}
          {type === 'system' && onRoleFilterChange && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Role
              </label>
              <Select value={roleFilter} onValueChange={onRoleFilterChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrators</SelectItem>
                  <SelectItem value="manager">Managers</SelectItem>
                  <SelectItem value="seller">Sellers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Placeholder for alignment */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {/* Empty for spacing */}
            </label>
            <div className="h-10"></div>
          </div>

          {/* Sort Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sort By
            </label>
            <Select value={sort} onValueChange={onSortChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
