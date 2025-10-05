'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Flame, Sparkles, TrendingUp, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryLink {
  name: string
  icon: string
  href: string
}

const iconMap = {
  Flame,
  Sparkles,
  TrendingUp,
  RefreshCcw,
}

export default function CategoryNavLinks({ categories }: { categories: CategoryLink[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = (href: string) => {
    // Extract query parameters from href
    const url = new URL(href, 'http://localhost')
    const params = url.searchParams

    // Check if we're on the search page
    if (!pathname.endsWith('/search')) return false

    // Get all current search params
    const hasCategory = searchParams.has('category') && searchParams.get('category') !== 'all'
    const hasPrice = searchParams.has('price') && searchParams.get('price') !== 'all'
    const hasTag = searchParams.has('tag') && searchParams.get('tag') !== 'all'
    const hasQuery = searchParams.has('q') && searchParams.get('q') !== 'all' && searchParams.get('q') !== ''

    // Only show active if ONLY the nav param is set (no other filters)
    const hasOtherFilters = hasCategory || hasPrice || hasTag || hasQuery

    // For discount (Hot Deals)
    if (params.get('discount')) {
      return searchParams.get('discount') === 'true' && !hasOtherFilters && 
             searchParams.get('secondHand') !== 'true' && searchParams.get('secondHand') !== 'false'
    }

    // For sort=latest (New Arrivals)
    if (params.get('sort') === 'latest') {
      return searchParams.get('sort') === 'latest' && !hasOtherFilters &&
             searchParams.get('discount') !== 'true' &&
             searchParams.get('secondHand') !== 'true' && searchParams.get('secondHand') !== 'false'
    }

    // For sort=best-selling (Best Sellers)
    if (params.get('sort') === 'best-selling') {
      // Best selling is the default, only active if no other params
      return !hasOtherFilters && 
             searchParams.get('discount') !== 'true' &&
             searchParams.get('secondHand') !== 'true' && searchParams.get('secondHand') !== 'false' &&
             (!searchParams.has('sort') || searchParams.get('sort') === 'best-selling')
    }

    // For secondHand (Second Hand)
    if (params.get('secondHand')) {
      return searchParams.get('secondHand') === 'true' && !hasOtherFilters &&
             searchParams.get('discount') !== 'true'
    }

    return false
  }

  return (
    <>
      {categories.map((category) => {
        const Icon = iconMap[category.icon as keyof typeof iconMap]
        const active = isActive(category.href)

        return (
          <Link
            key={category.name}
            href={category.href}
            className={cn(
              'flex items-center gap-2 text-white transition-all text-base font-medium px-3 py-2 rounded-md relative',
              active 
                ? 'bg-white/20 text-white shadow-md' 
                : 'hover:text-white/80 hover:bg-white/10'
            )}
          >
            <Icon className='h-5 w-5' />
            <span>{category.name}</span>
            {active && (
              <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full' />
            )}
          </Link>
        )
      })}
    </>
  )
}
