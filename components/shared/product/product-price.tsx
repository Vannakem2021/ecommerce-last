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

  // Discount display (has list price) - Option 1 Modern Layout
  return (
    <div className='space-y-1'>
      {/* Current Price - Large and prominent */}
      <div className={cn('text-2xl font-bold', className)}>
        <span className='text-sm align-super'>{currency.symbol}</span>
        {formattedIntValue}
        {currency.code !== 'KHR' && floatValue && (
          <span className='text-sm align-super'>{floatValue}</span>
        )}
      </div>

      {/* Old Price and Discount - Single line, subtle */}
      <div className='flex justify-center items-center gap-2 text-xs'>
        <span className='text-muted-foreground line-through'>
          {format.number(convertedListPrice, {
            style: 'currency',
            currency: currency.code,
            currencyDisplay: 'narrowSymbol',
            minimumFractionDigits: currency.code === 'KHR' ? 0 : 2,
            maximumFractionDigits: currency.code === 'KHR' ? 0 : 2,
          })}
        </span>
        <span className='inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-950/50 px-2 py-0.5 text-orange-700 dark:text-orange-400 font-medium'>
          -{discountPercent}%
        </span>
      </div>
    </div>
  )
}

export default ProductPrice
