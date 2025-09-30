'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getAllProductsForAdmin, getProductById } from '@/lib/actions/product.actions'

interface Product {
  _id: string
  name: string
  slug: string
  price: number
  listPrice?: number
  isPublished: boolean
}

interface ProductSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
}

export default function ProductSelector({ value, onChange }: ProductSelectorProps) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const retryRef = useRef(0)
  const [selectedProductsMap, setSelectedProductsMap] = useState<Record<string, Product>>({})

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced search reload
  useEffect(() => {
    const t = setTimeout(() => {
      loadProducts()
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Ensure selected products are always visible via a dedicated map
  useEffect(() => {
    if (!Array.isArray(value) || value.length === 0) {
      return
    }
    const currentIds = new Set(Object.keys(selectedProductsMap))
    const missingIds = value.filter((id) => !currentIds.has(id))
    if (missingIds.length === 0) {
      return
    }
    ;(async () => {
      try {
        // First, attempt to hydrate from the current products list
        const fromList: Record<string, Product> = {}
        for (const id of missingIds) {
          const found = products.find((p) => p._id === id)
          if (found) fromList[id] = found
        }

        // Fetch the rest by ID
        const stillMissing = missingIds.filter((id) => !fromList[id])
        const fetchedPairs: Array<[string, Product | null]> = await Promise.all(
          stillMissing.map(async (id) => {
            try {
              const prod = await getProductById(id)
              // Only map essential fields and keep shape consistent
              const mapped: Product = {
                _id: prod._id,
                name: prod.name,
                slug: prod.slug,
                price: prod.price,
                listPrice: prod.listPrice,
                isPublished: Boolean(prod.isPublished),
              }
              return [id, mapped]
            } catch {
              // Ignore fetch failures for individual IDs
              return [id, null]
            }
          })
        )

        const fetched: Record<string, Product> = {}
        for (const [id, item] of fetchedPairs) {
          if (item) fetched[id] = item
        }

        setSelectedProductsMap((prev) => {
          // Optionally prune entries not in value to keep memory tidy
          const next: Record<string, Product> = {}
          for (const id of value) {
            if (prev[id]) next[id] = prev[id]
          }
          return { ...next, ...fromList, ...fetched }
        })
      } catch {
        // noop; the main list still works
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, products])

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getAllProductsForAdmin({
        query: search,
        page: 1,
        limit: 100, // Load more products for selection
      })
      if (!result || !Array.isArray(result.products)) {
        throw new Error('Unexpected response while fetching products')
      }
      setProducts((result.products as Array<{ _id: string; name: string; slug: string; price: number; listPrice?: number; isPublished: boolean }>).filter((p) => p.isPublished))
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Unknown error'
      console.error('Failed to load products:', error)
      // Surface authorization/auth issues clearly
      if (/permission|authorize|auth|401|403/i.test(msg)) {
        setError('You do not have permission to view products.')
      } else {
        setError('Unable to load products. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedProducts: Product[] = value
    .map((id) => selectedProductsMap[id] || products.find((p) => p._id === id))
    .filter(Boolean) as Product[]

  const handleSelect = (productId: string) => {
    if (value.includes(productId)) {
      onChange(value.filter(id => id !== productId))
    } else {
      onChange([...value, productId])
    }
  }

  const handleRemove = (productId: string) => {
    onChange(value.filter(id => id !== productId))
  }

  return (
    <div className="space-y-2">
      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProducts.map((product) => (
            <Badge key={product._id} variant="secondary" className="pr-1">
              {product.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 ml-1"
                onClick={() => handleRemove(product._id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Product Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedProducts.length > 0
              ? `${selectedProducts.length} product(s) selected`
              : "Select products..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search products..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {loading
                  ? 'Loading...'
                  : error
                    ? (
                      <div className="flex flex-col gap-2 p-2">
                        <span className="text-red-600 text-sm">{error}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            retryRef.current += 1
                            loadProducts()
                          }}
                        >
                          Retry
                        </Button>
                      </div>
                    )
                    : 'No products found.'}
              </CommandEmpty>
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product._id}
                    value={product.name}
                    onSelect={() => handleSelect(product._id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(product._id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ${product.price} {product.listPrice !== product.price && (
                          <span className="line-through">${product.listPrice}</span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
