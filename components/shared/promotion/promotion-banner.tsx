'use client'

import { useState, useEffect } from 'react'
import { X, Tag, Percent, DollarSign, Truck, Clock } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getActivePromotions } from '@/lib/actions/promotion.actions'
import { IPromotionDetails } from '@/types'

interface PromotionBannerProps {
  limit?: number
  showDismiss?: boolean
  className?: string
}

export default function PromotionBanner({ 
  limit = 3, 
  showDismiss = true,
  className = ''
}: PromotionBannerProps) {
  const [promotions, setPromotions] = useState<IPromotionDetails[]>([])
  const [dismissedPromotions, setDismissedPromotions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPromotions()

    // Load dismissed promotions from localStorage
    const dismissed = localStorage.getItem('dismissedPromotions')
    if (dismissed) {
      setDismissedPromotions(JSON.parse(dismissed))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPromotions = async () => {
    try {
      const activePromotions = await getActivePromotions()
      setPromotions(activePromotions.slice(0, limit))
    } catch (error) {
      console.error('Failed to load promotions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = (promotionId: string) => {
    const newDismissed = [...dismissedPromotions, promotionId]
    setDismissedPromotions(newDismissed)
    localStorage.setItem('dismissedPromotions', JSON.stringify(newDismissed))
  }

  const getPromotionIcon = (type: string) => {
    switch (type) {
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

  const getPromotionValue = (promotion: IPromotionDetails) => {
    if (promotion.type === 'percentage') {
      return `${promotion.value}% OFF`
    } else if (promotion.type === 'fixed') {
      return `$${promotion.value} OFF`
    } else {
      return 'FREE SHIPPING'
    }
  }

  const getPromotionColor = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
      case 'fixed':
        return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
      case 'free_shipping':
        return 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800'
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800'
    }
  }

  const visiblePromotions = promotions.filter(
    promotion => !dismissedPromotions.includes(promotion._id)
  )

  if (loading || visiblePromotions.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {visiblePromotions.map((promotion) => (
        <Card 
          key={promotion._id} 
          className={`${getPromotionColor(promotion.type)} border-2`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getPromotionIcon(promotion.type)}
                  <Badge variant="secondary" className="font-mono">
                    {promotion.code}
                  </Badge>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">
                      {getPromotionValue(promotion)}
                    </span>
                    <span className="text-sm font-medium">
                      {promotion.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    {promotion.minOrderValue > 0 && (
                      <span>Min. order: ${promotion.minOrderValue}</span>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Valid until {format(new Date(promotion.endDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    
                    {promotion.usageLimit > 0 && (
                      <span>
                        {promotion.usageLimit - promotion.usedCount} uses left
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {showDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(promotion._id)}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {promotion.description && (
              <p className="text-sm text-muted-foreground mt-2">
                {promotion.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
