'use client'
import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import ProductPrice from '@/components/shared/product/product-price'
import OrderSummary from '@/components/shared/cart/order-summary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useUserCart from '@/hooks/use-user-cart'
import useSettingStore from '@/hooks/use-setting-store'
import { useAuthSession } from '@/hooks/use-auth-session'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

export default function CartPage() {
  const {
    cart: { items, itemsPrice, totalPrice, discountAmount },
    updateItem,
    removeItem,
  } = useUserCart()
  const router = useRouter()
  const { user } = useAuthSession()
  const locale = useLocale()
  const {
    setting: {
      site,
      common: { freeShippingMinPrice },
    },
  } = useSettingStore()

  const t = useTranslations()

  // Loading states for server operations
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Enhanced update item with loading/error handling
  const handleUpdateItem = async (item: { clientId: string; slug: string; name: string; image: string; price: number; color?: string; size?: string; quantity: number; countInStock: number }, quantity: number) => {
    setIsUpdating(true)
    setUpdateError(null)
    try {
      await updateItem(item, quantity)
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to update item')
    } finally {
      setIsUpdating(false)
    }
  }

  // Enhanced remove item with loading/error handling
  const handleRemoveItem = async (item: { clientId: string; slug: string; name: string; image: string; price: number; color?: string; size?: string; quantity: number; countInStock: number }) => {
    setIsUpdating(true)
    setUpdateError(null)
    try {
      await removeItem(item)
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to remove item')
    } finally {
      setIsUpdating(false)
    }
  }

  // Safe calculation with fallback if itemsPrice is NaN or undefined
  const safeItemsPrice = useMemo(() => {
    if (typeof itemsPrice === 'number' && !isNaN(itemsPrice)) {
      return itemsPrice
    }
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  }, [itemsPrice, items])

  // Safe total calculation
  const safeTotalPrice = useMemo(() => {
    if (typeof totalPrice === 'number' && !isNaN(totalPrice)) {
      return totalPrice
    }
    return safeItemsPrice
  }, [totalPrice, safeItemsPrice])
  return (
    <div>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {items.length === 0 ? (
          <Card className='col-span-4 rounded-lg border border-border'>
            <CardHeader className='text-3xl  '>
              {t('Cart.Your Shopping Cart is empty')}
            </CardHeader>
            <CardContent>
              {t.rich('Cart.Continue shopping on', {
                name: site.name,
                home: (chunks) => <Link href='/'>{chunks}</Link>,
              })}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className='col-span-1 md:col-span-3'>
              <Card className='rounded-lg border border-border'>
                <CardHeader className='text-xl md:text-3xl pb-3 md:pb-4 px-4 md:px-6'>
                  {t('Cart.Shopping Cart')}
                  {updateError && (
                    <div className='text-xs md:text-sm text-red-600 bg-red-50 p-2 rounded mt-2'>
                      {updateError}
                    </div>
                  )}
                </CardHeader>
                <CardContent className='p-4 md:p-6'>
                  <div className='hidden md:flex justify-end border-b mb-4 pb-2 text-sm text-muted-foreground'>
                    {t('Cart.Price')}
                  </div>

                  {items.map((item) => (
                    <div
                      key={item.clientId}
                      className='py-4 border-b last:border-b-0'
                    >
                      {/* Mobile & Desktop Layout */}
                      <div className='flex gap-3 md:gap-4'>
                        {/* Product Image */}
                        <Link href={`/product/${item.slug}`} className='flex-shrink-0'>
                          <div className='relative w-20 h-20 md:w-28 md:h-28 bg-muted rounded-md overflow-hidden group'>
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes='(max-width: 768px) 80px, 112px'
                              className='object-contain p-1.5 group-hover:scale-110 transition-transform duration-300'
                            />
                          </div>
                        </Link>

                        {/* Product Details */}
                        <div className='flex-1 min-w-0 flex flex-col'>
                          {/* Name and Price Row */}
                          <div className='flex justify-between gap-3 mb-2'>
                            <Link
                              href={`/product/${item.slug}`}
                              className='text-sm md:text-base font-medium hover:text-primary transition-colors line-clamp-2 flex-1'
                            >
                              {item.name}
                            </Link>
                            
                            {/* Price - Always Visible on Right */}
                            <div className='text-right flex-shrink-0'>
                              <p className='font-bold text-base md:text-lg'>
                                <ProductPrice
                                  price={item.price * item.quantity}
                                  plain
                                />
                              </p>
                              {item.quantity > 1 && (
                                <p className='text-xs text-muted-foreground'>
                                  {item.quantity} × <ProductPrice price={item.price} plain />
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Variants */}
                          {(item.color || item.size) && (
                            <div className='flex gap-3 text-xs md:text-sm text-muted-foreground mb-3'>
                              {item.color && <span>Color: {item.color}</span>}
                              {item.size && <span>Size: {item.size}</span>}
                            </div>
                          )}

                          {/* Actions Row */}
                          <div className='flex gap-2 mt-auto'>
                            <Select
                              value={item.quantity.toString()}
                              onValueChange={(value) =>
                                handleUpdateItem(item, Number(value))
                              }
                              disabled={isUpdating}
                            >
                              <SelectTrigger className='h-9 w-20 md:w-auto text-xs md:text-sm'>
                                <SelectValue>
                                  Qty: {item.quantity}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent position='popper'>
                                {Array.from({
                                  length: item.countInStock,
                                }).map((_, i) => (
                                  <SelectItem key={i + 1} value={`${i + 1}`}>
                                    {i + 1}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleRemoveItem(item)}
                              disabled={isUpdating}
                              className='h-9 text-xs md:text-sm text-destructive hover:text-destructive hover:bg-destructive/10'
                            >
                              {t('Cart.Delete')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className='flex justify-end text-lg my-2'>
                    {t('Cart.Subtotal')} (
                    {items.reduce((acc, item) => acc + item.quantity, 0)}{' '}
                    {t('Cart.Items')}):{' '}
                    <span className='font-bold ml-1'>
                      <ProductPrice price={safeItemsPrice} plain />
                    </span>{' '}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className='col-span-1'>
              <OrderSummary
                itemsPrice={safeItemsPrice}
                totalPrice={safeTotalPrice}
                discountAmount={discountAmount}
                itemCount={items.reduce((acc, item) => acc + item.quantity, 0)}
                freeShippingMinPrice={freeShippingMinPrice}
                showFreeShippingIndicator={true}
                showCoupon={true}
                showCheckoutButton={true}
                checkoutButtonText={user ? t('Cart.Proceed to Checkout') : t('Cart.Sign In to Checkout')}
                checkoutButtonOnClick={() => {
                  const checkoutPath = locale === 'en-US' ? '/checkout' : `/${locale}/checkout`
                  router.push(checkoutPath)
                }}
                showSignInMessage={!user}
                signInMessage={t('Cart.Sign in required to complete checkout')}
                sticky={true}
              />
            </div>
          </>
        )}
      </div>
      <BrowsingHistoryList className='mt-10' />
    </div>
  )
}
