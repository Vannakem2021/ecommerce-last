'use client'
import useSettingStore from '@/hooks/use-setting-store'
import { cn, round2 } from '@/lib/utils'
import { useFormatter, useTranslations } from 'next-intl'

const ProductPrice = ({
  price,
  className,
  listPrice = 0,
  plain = false,
}: {
  price: number
  listPrice?: number
  className?: string
  forListing?: boolean
  plain?: boolean
}) => {
  const { getCurrency } = useSettingStore()
  const currency = getCurrency()
  const t = useTranslations()

  // Get effective price (just regular price now)
  const effectivePrice = price
  let convertedEffectivePrice = round2(currency.convertRate * effectivePrice)
  let convertedListPrice = round2(currency.convertRate * listPrice)

  // For KHR, round to whole numbers (no decimals)
  if (currency.code === 'KHR') {
    convertedEffectivePrice = Math.round(convertedEffectivePrice)
    convertedListPrice = Math.round(convertedListPrice)
  }

  const format = useFormatter()

  // Determine current state
  const hasListPrice = listPrice > 0 && listPrice > effectivePrice
  const discountPercent = hasListPrice ? Math.round(((listPrice - effectivePrice) / listPrice) * 100) : 0

  const stringValue = convertedEffectivePrice.toString()
  const [intValue, floatValue] = stringValue.includes('.')
    ? stringValue.split('.')
    : [stringValue, '']

  // Format integer part with thousand separators
  const formattedIntValue = parseInt(intValue).toLocaleString()

  // Plain format for simple display
  if (plain) {
    return format.number(convertedEffectivePrice, {
      style: 'currency',
      currency: currency.code,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: currency.code === 'KHR' ? 0 : 2,
      maximumFractionDigits: currency.code === 'KHR' ? 0 : 2,
    })
  }

  // Regular price display (no list price or discount)
  if (!hasListPrice) {
    return (
      <div className={cn('text-3xl', className)}>
        <span className='text-xs align-super'>{currency.symbol}</span>
        {formattedIntValue}
        {currency.code !== 'KHR' && floatValue && (
          <span className='text-xs align-super'>{floatValue}</span>
        )}
      </div>
    )
  }

  // Discount display (has list price)
  return (
    <div className=''>
      <div className='flex justify-center gap-3'>
        <div className='text-3xl text-orange-700 dark:text-orange-400'>-{discountPercent}%</div>
        <div className={cn('text-3xl', className)}>
          <span className='text-xs align-super'>{currency.symbol}</span>
          {formattedIntValue}
          {currency.code !== 'KHR' && floatValue && (
            <span className='text-xs align-super'>{floatValue}</span>
          )}
        </div>
      </div>
      <div className='text-muted-foreground text-xs py-2'>
        {t('Product.List price')}:{' '}
        <span className='line-through'>
          {format.number(convertedListPrice, {
            style: 'currency',
            currency: currency.code,
            currencyDisplay: 'narrowSymbol',
            minimumFractionDigits: currency.code === 'KHR' ? 0 : 2,
            maximumFractionDigits: currency.code === 'KHR' ? 0 : 2,
          })}
        </span>
      </div>
    </div>
  )
}

export default ProductPrice
