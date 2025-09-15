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
import { getAllCategoriesForAdmin, getCategoryById } from '@/lib/actions/category.actions'

interface Category {
  _id: string
  name: string
  active: boolean
}

interface CategorySelectorProps {
  value: string[]
  onChange: (value: string[]) => void
}

export default function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCategoriesMap, setSelectedCategoriesMap] = useState<Record<string, Category>>({})

  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      loadCategories()
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Ensure selected categories are always visible via a map
  useEffect(() => {
    if (!Array.isArray(value) || value.length === 0) return
    const currentIds = new Set(Object.keys(selectedCategoriesMap))
    const missingIds = value.filter((id) => !currentIds.has(id))
    if (missingIds.length === 0) return

    ;(async () => {
      try {
        // Hydrate from current list first
        const fromList: Record<string, Category> = {}
        for (const id of missingIds) {
          const found = categories.find((c) => c._id === id)
          if (found) fromList[id] = found
        }
        const stillMissing = missingIds.filter((id) => !fromList[id])
        const fetchedPairs: Array<[string, Category | null]> = await Promise.all(
          stillMissing.map(async (id) => {
            try {
              const cat = await getCategoryById(id)
              const mapped: Category = {
                _id: cat._id,
                name: cat.name,
                active: Boolean(cat.active),
              }
              return [id, mapped]
            } catch (e) {
              return [id, null]
            }
          })
        )
        const fetched: Record<string, Category> = {}
        for (const [id, item] of fetchedPairs) {
          if (item) fetched[id] = item
        }
        setSelectedCategoriesMap((prev) => {
          const next: Record<string, Category> = {}
          for (const id of value) {
            if (prev[id]) next[id] = prev[id]
          }
          return { ...next, ...fromList, ...fetched }
        })
      } catch {
        // ignore
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, categories])

  const loadCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getAllCategoriesForAdmin({
        query: search,
        page: 1,
        sort: 'name-asc',
      })
      if (!result || !Array.isArray(result.categories)) {
        throw new Error('Unexpected response while fetching categories')
      }
      setCategories(result.categories.filter(cat => cat.active))
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Unknown error'
      console.error('Failed to load categories:', error)
      if (/permission|authorize|auth|401|403/i.test(msg)) {
        setError('You do not have permission to view categories.')
      } else {
        setError('Unable to load categories. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedCategories: Category[] = value
    .map((id) => selectedCategoriesMap[id] || categories.find((c) => c._id === id))
    .filter(Boolean) as Category[]

  const handleSelect = (categoryId: string) => {
    if (value.includes(categoryId)) {
      onChange(value.filter(id => id !== categoryId))
    } else {
      onChange([...value, categoryId])
    }
  }

  const handleRemove = (categoryId: string) => {
    onChange(value.filter(id => id !== categoryId))
  }

  return (
    <div className="space-y-2">
      {/* Selected Categories */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((category) => (
            <Badge key={category._id} variant="secondary" className="pr-1">
              {category.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 ml-1"
                onClick={() => handleRemove(category._id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Category Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCategories.length > 0
              ? `${selectedCategories.length} category(ies) selected`
              : "Select categories..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories..." value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>
                {loading
                  ? 'Loading...'
                  : error
                    ? (
                      <div className="flex flex-col gap-2 p-2">
                        <span className="text-red-600 text-sm">{error}</span>
                        <Button type="button" variant="outline" size="sm" onClick={() => loadCategories()}>
                          Retry
                        </Button>
                      </div>
                    )
                    : 'No categories found.'}
              </CommandEmpty>
              <CommandGroup>
                {categories.map((category) => (
                  <CommandItem
                    key={category._id}
                    value={category.name}
                    onSelect={() => handleSelect(category._id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(category._id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{category.name}</div>
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
