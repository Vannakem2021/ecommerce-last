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

  return (
    <form onSubmit={handleSubmit} className='flex items-stretch h-12 shadow-sm'>
      <Select value={category} onValueChange={setCategory} name='category'>
        <SelectTrigger className='w-40 h-full bg-background border border-r-0 rounded-none hover:bg-muted/50 transition-colors'>
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
      <Input
        className='flex-1 rounded-none bg-background border-y h-full focus-visible:ring-0 focus-visible:ring-offset-0'
        placeholder='Search For Products'
        name='q'
        type='search'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        type='submit'
        className='bg-primary hover:bg-primary/90 text-white rounded-none h-full px-6 py-2 transition-colors flex items-center justify-center'
      >
        <SearchIcon className='w-5 h-5' />
      </button>
    </form>
  )
}
