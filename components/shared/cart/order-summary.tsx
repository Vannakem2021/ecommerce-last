'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import ProductPrice from '@/components/shared/product/product-price'
import CouponInput from '@/components/shared/promotion/coupon-input'

interface OrderSummaryProps {
  // Prices
  itemsPrice: number
  shippingPrice?: number
  taxPrice?: number
  totalPrice: number
  discountAmount?: number
  
  // Items info
  itemCount?: number
  
  // Coupon
  showCoupon?: boolean
  
  // Actions
  showCheckoutButton?: boolean
  checkoutButtonText?: string
  checkoutButtonOnClick?: () => void
  checkoutButtonDisabled?: boolean
  
  showPlaceOrderButton?: boolean
  placeOrderButtonOnClick?: () => void
  placeOrderButtonDisabled?: boolean
  
  // Additional content
  helpText?: React.ReactNode
  signInMessage?: string
  showSignInMessage?: boolean
  
  // Styling
  sticky?: boolean
  className?: string
  
  // Site name for terms
  siteName?: string
}

export default function OrderSummary({
  itemsPrice,
  shippingPrice,
  taxPrice,
  totalPrice,
  discountAmount = 0,
  itemCount,
  showCoupon = true,
  showCheckoutButton = false,
  checkoutButtonText = 'Proceed to Checkout',
  checkoutButtonOnClick,
  checkoutButtonDisabled = false,
  showPlaceOrderButton = false,
  placeOrderButtonOnClick,
  placeOrderButtonDisabled = false,
  helpText,
  signInMessage,
  showSignInMessage = false,
  sticky = false,
  className = '',
  siteName,
}: OrderSummaryProps) {
  const safeItemsPrice = itemsPrice || 0
  const safeTotalPrice = totalPrice || 0

  return (
    <Card className={`rounded-lg border border-border ${sticky ? 'md:sticky md:top-4' : ''} ${className}`}>
      <CardHeader className='pb-4 px-4 md:px-6'>
        <h2 className='text-lg md:text-xl font-bold'>Order Summary</h2>
      </CardHeader>

      <CardContent className='p-4 md:p-6 pt-0 space-y-4'>
        {/* Place Order Button (for checkout - top position) */}
        {showPlaceOrderButton && (
          <div className='border-b pb-4'>
            <Button 
              onClick={placeOrderButtonOnClick} 
              size='lg' 
              className='w-full font-bold'
              disabled={placeOrderButtonDisabled}
            >
              Place Your Order
            </Button>
            {helpText && (
              <div className='text-xs text-center text-muted-foreground mt-3'>
                {helpText}
              </div>
            )}
          </div>
        )}

        {/* Coupon Section */}
        {showCoupon && (
          <>
            <div>
              <CouponInput />
            </div>
            <Separator />
          </>
        )}

        {/* Order Details */}
        <div className='space-y-3'>
          {/* Subtotal/Items */}
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>
              {itemCount !== undefined ? (
                <>
                  Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </>
              ) : (
                'Items'
              )}
            </span>
            <span className='font-medium'>
              <ProductPrice price={safeItemsPrice} plain />
            </span>
          </div>

          {/* Shipping & Handling (for checkout) */}
          {shippingPrice !== undefined && (
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Shipping & Handling</span>
              <span className='font-medium'>
                {shippingPrice === 0 ? (
                  <span className='text-green-600'>FREE</span>
                ) : (
                  <ProductPrice price={shippingPrice} plain />
                )}
              </span>
            </div>
          )}



          {/* Discount */}
          {discountAmount > 0 && (
            <div className='flex justify-between text-sm'>
              <span className='text-green-600'>Discount</span>
              <span className='font-medium text-green-600'>
                -<ProductPrice price={discountAmount} plain />
              </span>
            </div>
          )}

          <Separator />

          {/* Total */}
          <div className='flex justify-between items-center'>
            <span className='text-base font-bold'>
              {shippingPrice !== undefined || taxPrice !== undefined ? 'Order Total' : 'Total'}
            </span>
            <span className='text-xl font-bold'>
              <ProductPrice price={safeTotalPrice} plain />
            </span>
          </div>
        </div>

        {/* Sign In Message */}
        {showSignInMessage && signInMessage && (
          <div className='text-xs text-muted-foreground text-center bg-muted/30 rounded-md p-2'>
            {signInMessage}
          </div>
        )}

        {/* Checkout Button (for cart page) */}
        {showCheckoutButton && (
          <Button
            onClick={checkoutButtonOnClick}
            size='lg'
            className='w-full text-base font-medium'
            disabled={checkoutButtonDisabled}
          >
            {checkoutButtonText}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
