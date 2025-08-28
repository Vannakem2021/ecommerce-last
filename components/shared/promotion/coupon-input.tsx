'use client'

import { useState, useTransition } from 'react'
import { Loader2, Tag, X, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import useUserCart from '@/hooks/use-user-cart'
import { useSession } from 'next-auth/react'

export default function CouponInput() {
  const { data: session } = useSession()
  const { cart, applyPromotion, removePromotion } = useUserCart()
  const { toast } = useToast()
  const [couponCode, setCouponCode] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        variant: 'destructive',
        description: 'Please enter a coupon code',
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await applyPromotion(
          couponCode.trim(),
          session?.user?.id
        )

        if (result.success) {
          toast({
            description: `Coupon applied! You saved $${result.discount?.toFixed(2)}`,
          })
          setCouponCode('')
        } else {
          toast({
            variant: 'destructive',
            description: result.error || 'Failed to apply coupon',
          })
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          description: 'Failed to apply coupon. Please try again.',
        })
      }
    })
  }

  const handleRemoveCoupon = () => {
    startTransition(async () => {
      try {
        await removePromotion()
        toast({
          description: 'Coupon removed',
        })
      } catch (error) {
        toast({
          variant: 'destructive',
          description: 'Failed to remove coupon',
        })
      }
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon()
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span className="font-medium">Coupon Code</span>
          </div>

          {/* Applied Coupon Display */}
          {cart.appliedPromotion && (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <div>
                  <Badge variant="secondary" className="font-mono">
                    {cart.appliedPromotion.code}
                  </Badge>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    You saved ${cart.appliedPromotion.discountAmount.toFixed(2)}
                    {cart.appliedPromotion.freeShipping && ' + Free Shipping'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveCoupon}
                disabled={isPending}
                className="text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Coupon Input */}
          {!cart.appliedPromotion && (
            <div className="flex gap-2">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                disabled={isPending}
                className="font-mono"
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={isPending || !couponCode.trim()}
                className="shrink-0"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
          )}

          {/* Help Text */}
          <p className="text-xs text-muted-foreground">
            Enter a valid coupon code to get a discount on your order
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
