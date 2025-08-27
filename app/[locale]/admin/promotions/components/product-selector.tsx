'use client'

import { useState, useEffect } from 'react'
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
import { getAllProductsForAdmin } from '@/lib/actions/product.actions'

interface Product {
  _id: string
  name: string
  slug: string
  price: number
  listPrice: number
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

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const result = await getAllProductsForAdmin({
        query: search,
        page: 1,
        limit: 100, // Load more products for selection
      })
      setProducts(result.products)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedProducts = products.filter(product => 
    value.includes(product._id)
  )

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
                {loading ? "Loading..." : "No products found."}
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
