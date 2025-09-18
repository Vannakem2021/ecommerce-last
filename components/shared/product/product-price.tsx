'use client'
import useSettingStore from '@/hooks/use-setting-store'
import { cn, round2, isProductOnSale, getSaleDiscountPercentage, getEffectivePrice } from '@/lib/utils'
import { useFormatter, useTranslations } from 'next-intl'
import SaleCountdown from './sale-countdown'

const ProductPrice = ({
  price,
  className,
  listPrice = 0,
  salePrice,
  saleStartDate,
  saleEndDate,
  forListing = true,
  plain = false,
}: {
  price: number
  listPrice?: number
  salePrice?: number
  saleStartDate?: Date
  saleEndDate?: Date
  className?: string
  forListing?: boolean
  plain?: boolean
}) => {
  const { getCurrency } = useSettingStore()
  const currency = getCurrency()
  const t = useTranslations()

  // Create product object for utility functions
  const product = { price, listPrice, salePrice, saleStartDate, saleEndDate }

  // Get effective price (salePrice if on sale, otherwise regular price)
  const effectivePrice = getEffectivePrice(product)
  const convertedEffectivePrice = round2(currency.convertRate * effectivePrice)
  const convertedListPrice = round2(currency.convertRate * listPrice)

  const format = useFormatter()

  // Determine current state
  const isOnSale = isProductOnSale(product)
  const hasListPrice = listPrice > 0 && listPrice > effectivePrice
  const discountPercent = getSaleDiscountPercentage(product)

  const stringValue = convertedEffectivePrice.toString()
  const [intValue, floatValue] = stringValue.includes('.')
    ? stringValue.split('.')
    : [stringValue, '']

  // Plain format for simple display
  if (plain) {
    return format.number(convertedEffectivePrice, {
      style: 'currency',
      currency: currency.code,
      currencyDisplay: 'narrowSymbol',
    })
  }

  // Regular price display (no list price or discount)
  if (!hasListPrice) {
    return (
      <div className={cn('text-3xl', className)}>
        <span className='text-xs align-super'>{currency.symbol}</span>
        {intValue}
        <span className='text-xs align-super'>{floatValue}</span>
      </div>
    )
  }

  // Sale price display (currently within sale window)
  if (isOnSale && saleEndDate) {
    return (
      <div className='space-y-2'>
        <div className='flex justify-center items-center gap-2'>
          <span className='bg-red-700 rounded-sm p-1 text-white text-sm font-semibold'>
            {discountPercent}% {t('Product.Off')}
          </span>
          <span className='text-red-700 text-xs font-bold'>
            {t('Product.Limited time sale')}
          </span>
        </div>
        <div className='flex justify-center'>
          <SaleCountdown endDate={new Date(saleEndDate)} size="sm" />
        </div>
        <div
          className={`flex ${forListing && 'justify-center'} items-center gap-2`}
        >
          <div className={cn('text-3xl', className)}>
            <span className='text-xs align-super'>{currency.symbol}</span>
            {intValue}
            <span className='text-xs align-super'>{floatValue}</span>
          </div>
          <div className='text-muted-foreground text-xs py-2'>
            {t('Product.Was')}:{' '}
            <span className='line-through'>
              {format.number(convertedListPrice, {
                style: 'currency',
                currency: currency.code,
                currencyDisplay: 'narrowSymbol',
              })}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Regular discount display (has list price but not on sale)
  return (
    <div className=''>
      <div className='flex justify-center gap-3'>
        <div className='text-3xl text-orange-700 dark:text-orange-400'>-{discountPercent}%</div>
        <div className={cn('text-3xl', className)}>
          <span className='text-xs align-super'>{currency.symbol}</span>
          {intValue}
          <span className='text-xs align-super'>{floatValue}</span>
        </div>
      </div>
      <div className='text-muted-foreground text-xs py-2'>
        {t('Product.List price')}:{' '}
        <span className='line-through'>
          {format.number(convertedListPrice, {
            style: 'currency',
            currency: currency.code,
            currencyDisplay: 'narrowSymbol',
          })}
        </span>
      </div>
    </div>
  )
}

export default ProductPrice
