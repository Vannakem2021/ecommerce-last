'use client'

import { useState, useEffect } from 'react'
import { Tag, Percent, DollarSign, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getActivePromotions } from '@/lib/actions/promotion.actions'
import { IPromotionDetails } from '@/types'

// Global cache for promotions with expiry
let promotionCache: {
  data: IPromotionDetails[]
  timestamp: number
} | null = null

const CACHE_DURATION = 60000 // 1 minute cache

interface PromotionBadgeProps {
  productId?: string
  categoryId?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function PromotionBadge({ 
  productId, 
  categoryId, 
  className = '',
  size = 'sm'
}: PromotionBadgeProps) {
  const [applicablePromotions, setApplicablePromotions] = useState<IPromotionDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplicablePromotions()
  }, [productId, categoryId])

  const loadApplicablePromotions = async () => {
    try {
      let activePromotions: IPromotionDetails[]

      // Check cache first
      const now = Date.now()
      if (promotionCache && (now - promotionCache.timestamp) < CACHE_DURATION) {
        activePromotions = promotionCache.data
      } else {
        // Fetch from server and cache
        activePromotions = await getActivePromotions()
        promotionCache = {
          data: activePromotions,
          timestamp: now
        }
      }
      
      const applicable = activePromotions.filter(promotion => {
        // Site-wide promotions
        if (promotion.appliesTo === 'all') {
          return true
        }
        
        // Product-specific promotions
        if (promotion.appliesTo === 'products' && productId) {
          return promotion.applicableProducts?.some(
            (p: any) => p._id === productId || p.toString() === productId
          )
        }
        
        // Category-specific promotions
        if (promotion.appliesTo === 'categories' && categoryId) {
          return promotion.applicableCategories?.some(
            (c: any) => c._id === categoryId || c.toString() === categoryId
          )
        }
        
        return false
      })

      // Sort by promotion priority: free shipping first, then by discount value
      applicable.sort((a, b) => {
        // Free shipping always comes first
        if (a.type === 'free_shipping' && b.type !== 'free_shipping') return -1
        if (b.type === 'free_shipping' && a.type !== 'free_shipping') return 1

        // For non-free-shipping promotions, sort by value (highest first)
        if (a.type !== 'free_shipping' && b.type !== 'free_shipping') {
          return b.value - a.value
        }

        return 0
      })

      setApplicablePromotions(applicable.slice(0, 2)) // Show max 2 badges
    } catch (error) {
      console.error('Failed to load promotions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPromotionIcon = (type: string) => {
    const iconSize = size === 'lg' ? 'h-4 w-4' : size === 'md' ? 'h-3 w-3' : 'h-2 w-2'
    
    switch (type) {
      case 'percentage':
        return <Percent className={iconSize} />
      case 'fixed':
        return <DollarSign className={iconSize} />
      case 'free_shipping':
        return <Truck className={iconSize} />
      default:
        return <Tag className={iconSize} />
    }
  }

  const getPromotionText = (promotion: IPromotionDetails) => {
    if (promotion.type === 'percentage') {
      return `${promotion.value}% OFF`
    } else if (promotion.type === 'fixed') {
      return `$${promotion.value} OFF`
    } else {
      return 'FREE SHIP'
    }
  }

  const getPromotionVariant = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'default'
      case 'fixed':
        return 'secondary'
      case 'free_shipping':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getBadgeSize = () => {
    switch (size) {
      case 'lg':
        return 'text-sm px-3 py-1'
      case 'md':
        return 'text-xs px-2 py-1'
      case 'sm':
      default:
        return 'text-xs px-1.5 py-0.5'
    }
  }

  if (loading || applicablePromotions.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {applicablePromotions.map((promotion) => (
        <Badge
          key={promotion._id}
          variant={getPromotionVariant(promotion.type)}
          className={`${getBadgeSize()} flex items-center gap-1 font-bold`}
        >
          {getPromotionIcon(promotion.type)}
          {getPromotionText(promotion)}
        </Badge>
      ))}
    </div>
  )
}
