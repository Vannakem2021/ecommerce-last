'use client'

import { useState, useEffect } from 'react'
import { X, Tag, Percent, DollarSign, Truck, Clock, Copy, Check } from 'lucide-react'
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
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
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

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-5 w-5" />
      case 'fixed':
        return <DollarSign className="h-5 w-5" />
      case 'free_shipping':
        return <Truck className="h-5 w-5" />
      default:
        return <Tag className="h-5 w-5" />
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
          className="border"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {getPromotionIcon(promotion.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-base mb-1">{promotion.name}</h3>
                    <p className="text-sm font-bold text-primary">
                      {getPromotionValue(promotion)}
                    </p>
                  </div>
                  
                  {showDismiss && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDismiss(promotion._id)}
                      className="flex-shrink-0 h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {promotion.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {promotion.description}
                  </p>
                )}

                {/* Code and Details */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
                      {promotion.code}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCode(promotion.code)}
                      className="h-8"
                    >
                      {copiedCode === promotion.code ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Details row */}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                  {promotion.minOrderValue > 0 && (
                    <span>Min. order: ${promotion.minOrderValue}</span>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      Until {format(new Date(promotion.endDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  
                  {promotion.usageLimit > 0 && (
                    <span className="font-medium">
                      {promotion.usageLimit - promotion.usedCount} uses left
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
