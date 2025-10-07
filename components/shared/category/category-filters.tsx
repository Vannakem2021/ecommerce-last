'use client'

import { useState, useTransition } from 'react'
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
  CheckCircleIcon,
  SortAscIcon
} from 'lucide-react'

interface CategoryFiltersProps {
  totalResults?: number
  currentRange?: string
  className?: string
  initialQuery?: string
  initialStatus?: string
  initialSort?: string
}

export interface CategoryFilterState {
  status: string
  sort: string
}

export default function CategoryFilters({
  totalResults = 0,
  currentRange = '',
  className = '',
  initialQuery = '',
  initialStatus = 'all',
  initialSort = 'latest'
}: CategoryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [searchValue, setSearchValue] = useState(initialQuery)
  const [filters, setFilters] = useState<CategoryFilterState>({
    status: initialStatus,
    sort: initialSort
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  // Update URL params when filters change
  const updateURL = (query: string, newFilters: CategoryFilterState) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (query) {
      params.set('query', query)
    } else {
      params.delete('query')
    }
    
    if (newFilters.status !== 'all') {
      params.set('status', newFilters.status)
    } else {
      params.delete('status')
    }
    
    if (newFilters.sort !== 'latest') {
      params.set('sort', newFilters.sort)
    } else {
      params.delete('sort')
    }
    
    // Reset to page 1 when filters change
    params.delete('page')
    
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    updateURL(value, filters)
  }

  const handleFilterChange = (newFilters: CategoryFilterState) => {
    setFilters(newFilters)
    updateURL(searchValue, newFilters)
  }

  const statusOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'active', label: 'Active Only' },
    { value: 'inactive', label: 'Inactive Only' }
  ]

  const sortOptions = [
    { value: 'latest', label: 'Latest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' }
  ]

  const handleSingleFilterChange = (key: keyof CategoryFilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    handleFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    const resetFilters = {
      status: 'all',
      sort: 'latest'
    }
    setSearchValue('')
    setFilters(resetFilters)
    updateURL('', resetFilters)
  }

  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all' && value !== 'latest').length + (searchValue ? 1 : 0)

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
              placeholder="Search categories by name or description..."
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
                {totalResults === 1 ? ' category' : ' categories'}
              </span>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <CheckCircleIcon className="h-3 w-3" />
                  Status
                </label>
                <Select value={filters.status} onValueChange={(value) => handleSingleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
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
                <Select value={filters.sort} onValueChange={(value) => handleSingleFilterChange('sort', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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