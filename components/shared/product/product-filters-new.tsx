'use client'

import { useState, useEffect } from 'react'
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
  CheckCircleIcon
} from 'lucide-react'
import { getAllCategoriesForFilter, getAllBrandsForFilter } from '@/lib/actions/product.actions'

interface ProductFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onFilterChange: (filters: ProductFilterState) => void
  isPending?: boolean
  totalResults?: number
  currentRange?: string
  className?: string
}

export interface ProductFilterState {
  category: string
  brand: string
  stockStatus: string
  publishStatus: string
}

export default function ProductFilters({
  searchValue,
  onSearchChange,
  onFilterChange,
  isPending = false,
  totalResults = 0,
  currentRange = '',
  className = ''
}: ProductFiltersProps) {
  const [filters, setFilters] = useState<ProductFilterState>({
    category: 'all',
    brand: 'all',
    stockStatus: 'all',
    publishStatus: 'all'
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([])
  const [brands, setBrands] = useState<{ _id: string; name: string }[]>([])

  // Load categories and brands
  useEffect(() => {
    const loadFilters = async () => {
      const [categoriesData, brandsData] = await Promise.all([
        getAllCategoriesForFilter(),
        getAllBrandsForFilter()
      ])
      setCategories(categoriesData)
      setBrands(brandsData)
    }
    loadFilters()
  }, [])

  const stockStatuses = [
    { value: 'all', label: 'All Stock' },
    { value: 'in-stock', label: 'In Stock (>10)' },
    { value: 'low-stock', label: 'Low Stock (1-10)' },
    { value: 'out-of-stock', label: 'Out of Stock' }
  ]

  const publishStatuses = [
    { value: 'all', label: 'All Status' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' }
  ]

  const handleFilterChange = (key: keyof ProductFilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    const resetFilters = {
      category: 'all',
      brand: 'all',
      stockStatus: 'all',
      publishStatus: 'all'
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
    onSearchChange('')
  }

  const activeFiltersCount = Object.values(filters).filter(value =>
    value !== 'all'
  ).length + (searchValue ? 1 : 0)

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
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, SKU, or description..."
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
                {totalResults === 0 ? 'No products found' : `Showing ${currentRange}`}
              </span>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                      <SelectItem key={brand._id} value={brand._id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stock Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <PackageIcon className="h-3 w-3" />
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

              {/* Publish Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <CheckCircleIcon className="h-3 w-3" />
                  Publish Status
                </label>
                <Select value={filters.publishStatus} onValueChange={(value) => handleFilterChange('publishStatus', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {publishStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
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
