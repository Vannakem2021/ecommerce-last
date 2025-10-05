import { Package, Truck, RefreshCw, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShippingReturnsInfoProps {
  translations: {
    shippingTitle: string
    standardShipping: string
    expressShipping: string
    freeShippingThreshold: string
    returnsTitle: string
    returnPolicy: string
    returnWindow: string
    deliveryTitle: string
    deliveryInfo: string
  }
  className?: string
}

export default function ShippingReturnsInfo({
  translations,
  className,
}: ShippingReturnsInfoProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Shipping Options */}
      <div className='space-y-3'>
        <h3 className='text-lg font-semibold flex items-center gap-2'>
          <Truck className='w-5 h-5 text-primary' />
          {translations.shippingTitle}
        </h3>
        <div className='space-y-3 pl-7'>
          <div className='flex items-start gap-3 text-sm'>
            <Package className='w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5' />
            <div>
              <p className='font-medium'>{translations.standardShipping}</p>
              <p className='text-muted-foreground'>3-5 business days • $5.00</p>
            </div>
          </div>
          <div className='flex items-start gap-3 text-sm'>
            <Package className='w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5' />
            <div>
              <p className='font-medium'>{translations.expressShipping}</p>
              <p className='text-muted-foreground'>1-2 business days • $15.00</p>
            </div>
          </div>
          <div className='p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md'>
            <p className='text-sm text-green-800 dark:text-green-300 font-medium'>
              ✓ {translations.freeShippingThreshold}
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className='space-y-3'>
        <h3 className='text-lg font-semibold flex items-center gap-2'>
          <MapPin className='w-5 h-5 text-primary' />
          {translations.deliveryTitle}
        </h3>
        <p className='text-sm text-muted-foreground pl-7'>
          {translations.deliveryInfo}
        </p>
      </div>

      {/* Returns Policy */}
      <div className='space-y-3'>
        <h3 className='text-lg font-semibold flex items-center gap-2'>
          <RefreshCw className='w-5 h-5 text-primary' />
          {translations.returnsTitle}
        </h3>
        <div className='space-y-2 pl-7'>
          <p className='text-sm text-muted-foreground'>
            {translations.returnPolicy}
          </p>
          <div className='p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md'>
            <p className='text-sm text-blue-800 dark:text-blue-300 font-medium'>
              ℹ️ {translations.returnWindow}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
