'use client'

import { Tag, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import useUserCart from '@/hooks/use-user-cart'

interface DiscountSummaryProps {
  showDetails?: boolean
  className?: string
}

export default function DiscountSummary({ 
  showDetails = true, 
  className = '' 
}: DiscountSummaryProps) {
  const { cart } = useUserCart()

  if (!cart.appliedPromotion || !cart.discountAmount) {
    return null
  }

  return (
    <div className={className}>
      {showDetails && (
        <>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-green-600" />
              <span className="text-sm">Coupon</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {cart.appliedPromotion.code}
              </Badge>
            </div>
            <span className="text-sm font-medium text-green-600">
              -${cart.discountAmount.toFixed(2)}
            </span>
          </div>

          {cart.appliedPromotion.freeShipping && (
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
}
