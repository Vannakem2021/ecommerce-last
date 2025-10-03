'use client'

import { SearchIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, FormEvent } from 'react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'

export default function SearchForm({
  categories,
  allCategoriesText
}: {
  categories: string[]
  allCategoriesText: string
}) {
  const router = useRouter()
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const params = new URLSearchParams()
    if (category && category !== 'all') {
      params.set('category', category)
    }
    if (query.trim()) {
      params.set('q', query.trim())
    }

    router.push(`/search?${params.toString()}`)
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    
    // Navigate immediately when category is selected
    const params = new URLSearchParams()
    if (value && value !== 'all') {
      params.set('category', value)
    }
    if (query.trim()) {
      params.set('q', query.trim())
    }

    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className='flex items-stretch h-10 md:h-12 shadow-sm'>
      {/* Category Dropdown - Responsive width */}
      <Select value={category} onValueChange={handleCategoryChange} name='category'>
        <SelectTrigger className='w-32 sm:w-36 md:w-40 h-full bg-background border border-r-0 rounded-l-lg rounded-r-none hover:bg-muted/50 transition-colors text-xs md:text-sm'>
          <SelectValue placeholder={allCategoriesText} />
        </SelectTrigger>
        <SelectContent position='popper'>
          <SelectItem value='all'>{allCategoriesText}</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Search Input - Responsive */}
      <Input
        className='flex-1 rounded-none bg-background border-y h-full focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base px-2 md:px-3'
        placeholder='Search'
        name='q'
        type='search'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      {/* Search Button - Rounded right corner */}
      <button
        type='submit'
        className='bg-primary hover:bg-primary/90 text-white rounded-r-lg rounded-l-none h-full px-4 md:px-6 py-2 transition-colors flex items-center justify-center'
        aria-label='Search'
      >
        <SearchIcon className='w-4 h-4 md:w-5 md:h-5' />
      </button>
    </form>
  )
}
