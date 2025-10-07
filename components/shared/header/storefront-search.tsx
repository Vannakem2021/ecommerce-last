'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, ArrowRight, Package } from 'lucide-react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ProductPrice from '@/components/shared/product/product-price'

interface SearchResults {
  products: any[]
  categories: string[]
  totalCount: number
}

interface StorefrontSearchProps {
  categories: string[]
  allCategoriesText: string
}

export default function StorefrontSearch({
  categories,
  allCategoriesText,
}: StorefrontSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [results, setResults] = useState<SearchResults>({
    products: [],
    categories: [],
    totalCount: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch search results
  useEffect(() => {
    const searchProducts = async () => {
      if (query.trim().length < 2) {
        setResults({ products: [], categories: [], totalCount: 0 })
        setShowDropdown(false)
        return
      }

      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('q', query.trim())
        if (selectedCategory !== 'all') {
          params.set('category', selectedCategory)
        }

        const response = await fetch(`/api/storefront/search?${params.toString()}`)
        const data = await response.json()
        setResults(data)
        setShowDropdown(true)
      } catch (error) {
        console.error('Search error:', error)
        setResults({ products: [], categories: [], totalCount: 0 })
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, selectedCategory])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleProductClick = (slug: string) => {
    setShowDropdown(false)
    setQuery('')
    router.push(`/product/${slug}`)
  }

  const handleCategoryClick = (categoryName: string) => {
    setShowDropdown(false)
    setQuery('')
    router.push(`/search?category=${categoryName}`)
  }

  const handleViewAll = () => {
    setShowDropdown(false)
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set('q', query.trim())
    }
    if (selectedCategory !== 'all') {
      params.set('category', selectedCategory)
    }
    router.push(`/search?${params.toString()}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleViewAll()
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="flex items-stretch h-10 md:h-12 shadow-sm">
        {/* Category Dropdown */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-32 sm:w-36 md:w-40 h-full bg-background border border-r-0 rounded-l-lg rounded-r-none hover:bg-muted/50 transition-colors text-xs md:text-sm">
            <SelectValue placeholder={allCategoriesText} />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">{allCategoriesText}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search Input */}
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            className="flex-1 rounded-none bg-background border-y h-full focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base px-2 md:px-3"
            placeholder="Search products..."
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim().length >= 2) {
                setShowDropdown(true)
              }
            }}
          />
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-white rounded-r-lg rounded-l-none h-full px-4 md:px-6 py-2 transition-colors flex items-center justify-center"
          aria-label="Search"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
          ) : (
            <Search className="w-4 h-4 md:w-5 md:h-5" />
          )}
        </button>
      </form>

      {/* Dropdown Results */}
      {showDropdown && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg max-h-[500px] overflow-y-auto z-[100]">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Searching...</p>
            </div>
          ) : results.totalCount === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">No products found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search terms
              </p>
            </div>
          ) : (
            <>
              {/* Products Section */}
              {results.products.length > 0 && (
                <div className="p-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                    Products ({results.products.length})
                  </div>
                  <div className="space-y-1">
                    {results.products.map((product) => (
                      <button
                        key={product._id}
                        onClick={() => handleProductClick(product.slug)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-md transition-colors text-left"
                      >
                        <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                          {product.images && product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{product.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="text-sm font-semibold">
                              <ProductPrice price={product.price} plain />
                            </div>
                            {product.avgRating > 0 && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <span>⭐</span>
                                <span>{product.avgRating.toFixed(1)}</span>
                              </div>
                            )}
                            {product.countInStock > 0 ? (
                              <Badge variant="secondary" className="text-xs">
                                In Stock
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                Out of Stock
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories Section */}
              {results.categories.length > 0 && (
                <div className="p-3 border-t">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                    Categories ({results.categories.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className="text-sm px-3 py-1.5 bg-muted hover:bg-muted/70 rounded-full transition-colors"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* View All Footer */}
              {results.totalCount > results.products.length && (
                <div className="p-3 border-t">
                  <button
                    onClick={handleViewAll}
                    className="w-full flex items-center justify-center gap-2 p-2 text-sm font-medium text-primary hover:bg-muted rounded-md transition-colors"
                  >
                    <span>View All {results.totalCount} Results</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
