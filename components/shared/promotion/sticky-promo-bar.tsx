'use client'

import { useState, useEffect } from 'react'
import { X, Tag, Percent, DollarSign, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getActivePromotions } from '@/lib/actions/promotion.actions'
import { IPromotionDetails } from '@/types'

export default function StickyPromoBar() {
  const [promo, setPromo] = useState<IPromotionDetails | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already dismissed in this session
    if (sessionStorage.getItem('promoBarDismissed')) {
      setDismissed(true)
      return
    }

    // Load the highest priority site-wide promotion
    getActivePromotions().then(promos => {
      // Prioritize: free_shipping > percentage > fixed
      const siteWide = promos.find((p: any) => p.appliesTo === 'all')
      if (siteWide) setPromo(siteWide)
    })
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('promoBarDismissed', 'true')
  }

  const getIcon = () => {
    if (!promo) return <Tag className="h-4 w-4" />
    
    switch (promo.type) {
      case 'percentage':
        return <Percent className="h-4 w-4" />
      case 'fixed':
        return <DollarSign className="h-4 w-4" />
      case 'free_shipping':
        return <Truck className="h-4 w-4" />
      default:
        return <Tag className="h-4 w-4" />
    }
  }

  const getPromoText = () => {
    if (!promo) return ''
    
    if (promo.type === 'percentage') {
      return `${promo.value}% OFF`
    } else if (promo.type === 'fixed') {
      return `$${promo.value} OFF`
    } else {
      return 'FREE SHIPPING'
    }
  }

  if (!promo || dismissed) return null

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm font-medium sticky top-0 z-50">
      <div className="container mx-auto">
        <div className="flex items-center justify-center gap-2 relative">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span>
              🎉 Use code{' '}
              <strong className="font-mono mx-1 px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded">
                {promo.code}
              </strong>{' '}
              for <strong>{getPromoText()}</strong>
              {promo.minOrderValue > 0 && ` on orders $${promo.minOrderValue}+`}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="absolute right-0 h-7 w-7 hover:bg-black/10 dark:hover:bg-white/10 text-primary-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
