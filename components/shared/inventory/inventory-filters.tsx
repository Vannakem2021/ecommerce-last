'use client'

import React, { useState, useEffect } from 'react'
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
  PackageIcon,
  TagIcon,
  AlertTriangleIcon,
  SortAscIcon
} from 'lucide-react'

interface InventoryFiltersProps {
  brands: string[]
  categories: string[]
  totalResults?: number
  currentRange?: string
  className?: string
}

export interface InventoryFilterState {
  brand: string
  category: string
  stockStatus: string
  sort: string
}

export default function InventoryFilters({
  brands,
  categories,
  totalResults = 0,
  currentRange = '',
  className = ''
}: InventoryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchValue, setSearchValue] = useState(searchParams.get('query') || '')
  const [isPending, setIsPending] = useState(false)
  const [filters, setFilters] = useState<InventoryFilterState>({
    brand: searchParams.get('brand') || 'all',
    category: searchParams.get('category') || 'all',
    stockStatus: searchParams.get('stockStatus') || 'all',
    sort: searchParams.get('sort') || 'latest'
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const debounceRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  const updateURL = (updates: Partial<InventoryFilterState & { query: string }>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update each parameter
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    // Reset to page 1 when filters change
    params.set('page', '1')
    
    setIsPending(true)
    router.push(`?${params.toString()}`)
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    
    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      updateURL({ query: value })
    }, 500)
  }

  const handleFilterChange = (key: keyof InventoryFilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateURL({ [key]: value })
  }

  // Clear isPending when searchParams change
  useEffect(() => {
    setIsPending(false)
  }, [searchParams])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const stockStatuses = [
    { value: 'all', label: 'All Stock Levels' },
    { value: 'in-stock', label: 'In Stock (>10)' },
    { value: 'low-stock', label: 'Low Stock (1-10)' },
    { value: 'out-of-stock', label: 'Out of Stock (0)' }
  ]

  const sortOptions = [
    { value: 'latest', label: 'Latest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'stock-low', label: 'Stock Low-High' },
    { value: 'stock-high', label: 'Stock High-Low' }
  ]

  const clearAllFilters = () => {
    setSearchValue('')
    setFilters({
      brand: 'all',
      category: 'all',
      stockStatus: 'all',
      sort: 'latest'
    })
    
    // Clear all URL params
    router.push(window.location.pathname)
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
              placeholder="Search by name, SKU, brand, or category..."
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
                {totalResults === 1 ? ' product' : ' products'}
              </span>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Brand Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <TagIcon className="h-3 w-3" />
                  Brand
                </label>
                <Select value={filters.brand} onValueChange={(value) => handleFilterChange('brand', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <PackageIcon className="h-3 w-3" />
                  Category
                </label>
                <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stock Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <AlertTriangleIcon className="h-3 w-3" />
                  Stock Status
                </label>
                <Select value={filters.stockStatus} onValueChange={(value) => handleFilterChange('stockStatus', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stockStatuses.map((status) => (
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
                <Select value={filters.sort} onValueChange={(value) => handleFilterChange('sort', value)}>
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