'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  ShoppingCart,
  Package,
  Users,
  FolderIcon,
  TagIcon,
  Loader2,
  ArrowRight
} from 'lucide-react'
import Image from 'next/image'
import ProductPrice from '@/components/shared/product/product-price'

interface SearchResults {
  orders: any[]
  products: any[]
  users: any[]
  categories: any[]
  brands: any[]
}

export default function AdminGlobalSearch() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResults>({
    orders: [],
    products: [],
    users: [],
    categories: [],
    brands: []
  })
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout>()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (searchValue.length < 2) {
      setResults({
        orders: [],
        products: [],
        users: [],
        categories: [],
        brands: []
      })
      setIsOpen(false)
      return
    }

    setIsLoading(true)

    timerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(searchValue)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data)
          setIsOpen(true)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [searchValue])

  const handleNavigate = (path: string) => {
    router.push(path)
    setIsOpen(false)
    setSearchValue('')
    setIsFocused(false)
    inputRef.current?.blur()
  }

  const totalResults = 
    results.orders.length + 
    results.products.length + 
    results.users.length + 
    results.categories.length + 
    results.brands.length

  const hasResults = totalResults > 0

  return (
    <div ref={searchRef} className="relative">
      <div className={`relative transition-all duration-200 ${isFocused ? 'w-[300px]' : 'w-[200px]'}`}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="pl-9 pr-9 h-9 bg-muted/50 border-muted-foreground/20 focus:bg-background focus:border-primary transition-all"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && hasResults && (
        <Card className="absolute top-full mt-2 w-[400px] max-h-[500px] overflow-auto shadow-lg z-50 right-0">
          <CardContent className="p-0">
            {/* Orders */}
            {results.orders.length > 0 && (
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <ShoppingCart className="h-4 w-4" />
                    ORDERS ({results.orders.length})
                  </div>
                </div>
                <div className="space-y-1">
                  {results.orders.map((order) => (
                    <button
                      key={order._id}
                      onClick={() => handleNavigate(`/admin/orders/${order._id}`)}
                      className="w-full text-left p-2 hover:bg-muted rounded-md transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">Order #{order._id.slice(-8)}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.user?.name || 'Unknown'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            <ProductPrice price={order.totalPrice} plain />
                          </div>
                          <div className="flex gap-1">
                            {order.isPaid && (
                              <Badge variant="secondary" className="text-xs">Paid</Badge>
                            )}
                            {order.isDelivered && (
                              <Badge variant="secondary" className="text-xs">Delivered</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {results.products.length > 0 && (
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Package className="h-4 w-4" />
                    PRODUCTS ({results.products.length})
                  </div>
                </div>
                <div className="space-y-1">
                  {results.products.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => handleNavigate(`/admin/products/${product._id}`)}
                      className="w-full text-left p-2 hover:bg-muted rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {product.image && (
                          <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{product.name}</div>
                          <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                        </div>
                        <div className="text-sm font-semibold">
                          <ProductPrice price={product.price} plain />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {results.users.length > 0 && (
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Users className="h-4 w-4" />
                    USERS ({results.users.length})
                  </div>
                </div>
                <div className="space-y-1">
                  {results.users.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => {
                        if (user.role === 'user') {
                          handleNavigate(`/admin/users/customers/${user._id}/view`)
                        } else {
                          handleNavigate(`/admin/users/system/${user._id}/edit`)
                        }
                      }}
                      className="w-full text-left p-2 hover:bg-muted rounded-md transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {user.role}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {results.categories.length > 0 && (
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <FolderIcon className="h-4 w-4" />
                    CATEGORIES ({results.categories.length})
                  </div>
                </div>
                <div className="space-y-1">
                  {results.categories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => handleNavigate(`/admin/categories/${category._id}`)}
                      className="w-full text-left p-2 hover:bg-muted rounded-md transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{category.name}</div>
                        <Badge variant={category.active ? 'default' : 'secondary'} className="text-xs">
                          {category.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Brands */}
            {results.brands.length > 0 && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <TagIcon className="h-4 w-4" />
                    BRANDS ({results.brands.length})
                  </div>
                </div>
                <div className="space-y-1">
                  {results.brands.map((brand) => (
                    <button
                      key={brand._id}
                      onClick={() => handleNavigate(`/admin/brands/${brand._id}`)}
                      className="w-full text-left p-2 hover:bg-muted rounded-md transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {brand.logo && (
                            <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={brand.logo}
                                alt={brand.name}
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                          <div className="font-medium text-sm">{brand.name}</div>
                        </div>
                        <Badge variant={brand.active ? 'default' : 'secondary'} className="text-xs">
                          {brand.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {isOpen && !hasResults && !isLoading && searchValue.length >= 2 && (
        <Card className="absolute top-full mt-2 w-[400px] shadow-lg z-50 right-0">
          <CardContent className="p-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No results found for "{searchValue}"</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
