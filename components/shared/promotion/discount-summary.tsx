'use client'

import { Tag, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import useUserCart from '@/hooks/use-user-cart'
import { memo } from 'react'

interface DiscountSummaryProps {
  showDetails?: boolean
  className?: string
}

function DiscountSummary({
  showDetails = true,
  className = ''
}: DiscountSummaryProps) {
  const { cart } = useUserCart()

  // Enhanced null/undefined checks with data validation
  if (!cart?.appliedPromotion ||
      !cart?.discountAmount ||
      isNaN(cart.discountAmount) ||
      cart.discountAmount <= 0) {
    return null
  }

  // Validate promotion data
  const promotion = cart.appliedPromotion
  if (!promotion.code || !promotion.discountAmount) {
    console.warn('Invalid promotion data:', promotion)
    return null
  }

  try {
    return (
      <div className={className}>
        {showDetails && (
          <>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-600" />
                <span className="text-sm">Coupon</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {promotion.code}
                </Badge>
              </div>
              <span className="text-sm font-medium text-green-600">
                -${cart.discountAmount.toFixed(2)}
              </span>
            </div>

            {promotion.freeShipping && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Free Shipping</span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  Free
                </span>
              </div>
            )}

            <Separator className="my-2" />
          </>
        )}

        {!showDetails && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600">Discount Applied</span>
            <span className="text-sm font-medium text-green-600">
              -${cart.discountAmount.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('Error rendering discount summary:', error)
    // Fallback display for errors
    return (
      <div className={className}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Discount unavailable</span>
        </div>
      </div>
    )
  }
}

// Memoize component to prevent unnecessary re-renders
export default memo(DiscountSummary)
