/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useUserCart from '@/hooks/use-user-cart'
import { useToast } from '@/hooks/use-toast'
import { OrderItem } from '@/types'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'

/**
 * Add to Cart Component
 *
 * This component allows users to add items to cart without authentication.
 * Cart items persist regardless of authentication state. Users will be
 * prompted to sign in only when they proceed to checkout.
 */

export default function AddToCart({
  item,
  minimal = false,
  iconOnly = false,
}: {
  item: OrderItem
  minimal?: boolean
  iconOnly?: boolean
}) {
  const router = useRouter()
  const { toast } = useToast()
  const locale = useLocale()

  const { addItem } = useUserCart()

  //PROMPT: add quantity state
  const [quantity, setQuantity] = useState(1)

  const t = useTranslations()

  // Check if product is in stock
  const isInStock = item.countInStock > 0

  return minimal ? (
    <Button
      variant='outline'
      className={iconOnly 
        ? 'rounded-lg h-10 w-10 p-0 border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors flex-shrink-0'
        : 'rounded-lg w-full border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors gap-2'
      }
      disabled={!isInStock}
      onClick={async () => {
        if (!isInStock) {
          toast({
            variant: 'destructive',
            description: t('Product.Out of Stock'),
          })
          return
        }
        try {
          await addItem(item, 1)
          toast({
            description: t('Product.Added to Cart'),
            action: (
              <Button
                onClick={() => {
                  const cartPath = locale === 'en-US' ? '/cart' : `/${locale}/cart`
                  router.push(cartPath)
                }}
              >
                {t('Product.Go to Cart')}
              </Button>
            ),
          })
        } catch (error: any) {
          toast({
            variant: 'destructive',
            description: error.message,
          })
        }
      }}
    >
      <ShoppingCart className={iconOnly ? 'h-5 w-5' : 'h-4 w-4'} />
      {!iconOnly && (isInStock ? t('Product.Add to Cart') : t('Product.Out of Stock'))}
    </Button>
  ) : (
    <div className='w-full space-y-2'>
      {!isInStock ? (
        <div className='text-center py-4'>
          <p className='text-red-600 font-medium'>{t('Product.Out of Stock')}</p>
        </div>
      ) : (
        <>
          <Select
            value={quantity.toString()}
            onValueChange={(i) => setQuantity(Number(i))}
            disabled={!isInStock}
          >
            <SelectTrigger className=''>
              <SelectValue>
                {t('Product.Quantity')}: {quantity}
              </SelectValue>
            </SelectTrigger>
            <SelectContent position='popper'>
              {Array.from({ length: item.countInStock }).map((_, i) => (
                <SelectItem key={i + 1} value={`${i + 1}`}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            className='rounded-full w-full'
            type='button'
            disabled={!isInStock}
            onClick={async () => {
              if (!isInStock) {
                toast({
                  variant: 'destructive',
                  description: t('Product.Out of Stock'),
                })
                return
              }
              try {
                await addItem(item, quantity)
                toast({
                  description: t('Product.Added to Cart'),
                  action: (
                    <Button
                      onClick={() => {
                        const cartPath = locale === 'en-US' ? '/cart' : `/${locale}/cart`
                        router.push(cartPath)
                      }}
                    >
                      {t('Product.Go to Cart')}
                    </Button>
                  ),
                })
              } catch (error: any) {
                toast({
                  variant: 'destructive',
                  description: error.message,
                })
              }
            }}
          >
            {t('Product.Add to Cart')}
          </Button>
          <Button
            variant='secondary'
            disabled={!isInStock}
            onClick={async () => {
              if (!isInStock) {
                toast({
                  variant: 'destructive',
                  description: t('Product.Out of Stock'),
                })
                return
              }
              try {
                await addItem(item, quantity)
                const checkoutPath = locale === 'en-US' ? '/checkout' : `/${locale}/checkout`
                router.push(checkoutPath)
              } catch (error: any) {
                toast({
                  variant: 'destructive',
                  description: error.message,
                })
              }
            }}
            className='w-full rounded-full '
          >
            {t('Product.Buy Now')}
          </Button>
        </>
      )}
    </div>
  )
}
