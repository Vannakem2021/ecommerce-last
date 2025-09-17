'use client'
import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import ProductPrice from '@/components/shared/product/product-price'
import CouponInput from '@/components/shared/promotion/coupon-input'
import DiscountSummary from '@/components/shared/promotion/discount-summary'
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
  const handleUpdateItem = async (item: any, quantity: number) => {
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
  const handleRemoveItem = async (item: any) => {
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
      <div className='grid grid-cols-1 md:grid-cols-4  md:gap-4'>
        {items.length === 0 ? (
          <Card className='col-span-4 rounded-none'>
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
            <div className='col-span-3'>
              <Card className='rounded-none'>
                <CardHeader className='text-3xl pb-0'>
                  {t('Cart.Shopping Cart')}
                  {updateError && (
                    <div className='text-sm text-red-600 bg-red-50 p-2 rounded mt-2'>
                      {updateError}
                    </div>
                  )}
                </CardHeader>
                <CardContent className='p-4'>
                  <div className='flex justify-end border-b mb-4'>
                    {t('Cart.Price')}
                  </div>

                  {items.map((item) => (
                    <div
                      key={item.clientId}
                      className='flex flex-col md:flex-row justify-between py-4 border-b gap-4'
                    >
                      <Link href={`/product/${item.slug}`}>
                        <div className='relative w-40 h-40'>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes='20vw'
                            style={{
                              objectFit: 'contain',
                            }}
                          />
                        </div>
                      </Link>

                      <div className='flex-1 space-y-4'>
                        <Link
                          href={`/product/${item.slug}`}
                          className='text-lg hover:no-underline  '
                        >
                          {item.name}
                        </Link>
                        <div>
                          <p className='text-sm'>
                            <span className='font-bold'>
                              {' '}
                              {t('Cart.Color')}:{' '}
                            </span>{' '}
                            {item.color}
                          </p>
                          <p className='text-sm'>
                            <span className='font-bold'>
                              {' '}
                              {t('Cart.Size')}:{' '}
                            </span>{' '}
                            {item.size}
                          </p>
                        </div>
                        <div className='flex gap-2 items-center'>
                          <Select
                            value={item.quantity.toString()}
                            onValueChange={(value) =>
                              handleUpdateItem(item, Number(value))
                            }
                            disabled={isUpdating}
                          >
                            <SelectTrigger className='w-auto'>
                              <SelectValue>
                                {t('Cart.Quantity')}: {item.quantity}
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
                            variant={'outline'}
                            onClick={() => handleRemoveItem(item)}
                            disabled={isUpdating}
                          >
                            {t('Cart.Delete')}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className='text-right'>
                          {item.quantity > 1 && (
                            <>
                              {item.quantity} x
                              <ProductPrice price={item.price} plain />
                              <br />
                            </>
                          )}

                          <span className='font-bold text-lg'>
                            <ProductPrice
                              price={item.price * item.quantity}
                              plain
                            />
                          </span>
                        </p>
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
            <div className='space-y-4'>
              {/* Coupon Input */}
              <CouponInput />

              <Card className='rounded-none'>
                <CardContent className='py-4 space-y-4'>
                  {safeItemsPrice < freeShippingMinPrice ? (
                    <div className='flex-1'>
                      {t('Cart.Add')}{' '}
                      <span className='text-green-700'>
                        <ProductPrice
                          price={freeShippingMinPrice - safeItemsPrice}
                          plain
                        />
                      </span>{' '}
                      {t(
                        'Cart.of eligible items to your order to qualify for FREE Shipping'
                      )}
                    </div>
                  ) : (
                    <div className='flex-1'>
                      <span className='text-green-700'>
                        {t('Cart.Your order qualifies for FREE Shipping')}
                      </span>{' '}
                      {t('Cart.Choose this option at checkout')}
                    </div>
                  )}
                  <div className='text-lg'>
                    {t('Cart.Subtotal')} (
                    {items.reduce((acc, item) => acc + item.quantity, 0)}{' '}
                    {t('Cart.items')}):{' '}
                    <span className='font-bold'>
                      <ProductPrice price={safeItemsPrice} plain />
                    </span>{' '}
                  </div>

                  {/* Discount Summary */}
                  <DiscountSummary showDetails={false} />

                  {discountAmount && (
                    <div className='text-lg font-bold border-t pt-2'>
                      {t('Cart.Total')}: <ProductPrice price={safeTotalPrice} plain />
                    </div>
                  )}

                  {!user && (
                    <div className='text-sm text-muted-foreground text-center mb-2'>
                      {t('Cart.Sign in required to complete checkout')}
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      const checkoutPath = locale === 'en-US' ? '/checkout' : `/${locale}/checkout`
                      router.push(checkoutPath)
                    }}
                    className='rounded-full w-full'
                  >
                    {user ? t('Cart.Proceed to Checkout') : t('Cart.Sign In to Checkout')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
      <BrowsingHistoryList className='mt-10' />
    </div>
  )
}
