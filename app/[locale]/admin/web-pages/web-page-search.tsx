'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface WebPageSearchProps {
  initialQuery?: string
}

export default function WebPageSearch({ initialQuery = '' }: WebPageSearchProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(initialQuery)
  const timerRef = useRef<NodeJS.Timeout>()

  // Debounced search - update URL after user stops typing
  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Set new timer
    timerRef.current = setTimeout(() => {
      // Only update if search value is different from initial
      if (searchValue !== initialQuery) {
        startTransition(() => {
          if (searchValue) {
            router.push(`?query=${encodeURIComponent(searchValue)}`)
          } else {
            router.push('?')
          }
        })
      }
    }, 500) // Wait 500ms after user stops typing

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [searchValue]) // Only depend on searchValue

  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search pages..."
        className="pl-8 w-[250px]"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        disabled={isPending}
      />
    </div>
  )
}
