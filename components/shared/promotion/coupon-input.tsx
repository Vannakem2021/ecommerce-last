'use client'

import { useState, useTransition, useCallback, useRef } from 'react'
import { Loader2, Tag, X, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [, setRetryCount] = useState(0)

  // Debounced coupon application to prevent rapid-fire requests
  const debouncedApplyCoupon = useCallback((code: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const result = await applyPromotion(code, session?.user?.id)

          if (result.success) {
            toast({
              description: `Coupon applied! You saved $${result.discount?.toFixed(2)}`,
            })
            setCouponCode('')
            setRetryCount(0)
          } else {
            toast({
              variant: 'destructive',
              description: result.error || 'Failed to apply coupon',
            })
          }
        } catch (error) {
          console.error('Failed to apply coupon:', error)
          toast({
            variant: 'destructive',
            description: 'Network error. Please try again.',
          })
        }
      })
    }, 300) // 300ms debounce
  }, [applyPromotion, session?.user?.id, toast])

  const handleApplyCoupon = () => {
    // Client-side validation
    if (!couponCode.trim()) {
      toast({
        variant: 'destructive',
        description: 'Please enter a coupon code',
      })
      return
    }

    if (couponCode.trim().length < 3) {
      toast({
        variant: 'destructive',
        description: 'Coupon code must be at least 3 characters',
      })
      return
    }

    debouncedApplyCoupon(couponCode.trim())
  }

  const handleRemoveCoupon = () => {
    startTransition(async () => {
      try {
        await removePromotion()
        toast({
          description: 'Coupon removed',
        })
        setRetryCount(0)
      } catch (error) {
        console.error('Failed to remove coupon:', error)
        toast({
          variant: 'destructive',
          description: 'Failed to remove coupon. Please try again.',
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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Have a Coupon Code?</span>
      </div>

      {/* Applied Coupon Display */}
      {cart.appliedPromotion && (
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Badge variant="secondary" className="font-mono text-xs">
                {cart.appliedPromotion.code}
              </Badge>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Saved ${cart.appliedPromotion.discountAmount.toFixed(2)}
                {cart.appliedPromotion.freeShipping && ' + Free Shipping'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCoupon}
            disabled={isPending}
            className="h-8 w-8 p-0 text-green-700 hover:text-green-800 hover:bg-green-100 dark:text-green-300 dark:hover:text-green-200 dark:hover:bg-green-900 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Coupon Input */}
      {!cart.appliedPromotion && (
        <div className="flex gap-2">
          <Input
            placeholder="Enter code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            disabled={isPending}
            className="font-mono text-sm h-10"
          />
          <Button
            onClick={handleApplyCoupon}
            disabled={isPending || !couponCode.trim()}
            size="sm"
            className="shrink-0 h-10 px-4"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Apply'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
