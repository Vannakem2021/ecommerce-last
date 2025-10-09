import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { IProduct } from '@/lib/db/models/product.model'
import Rating from './rating'
import { formatNumber } from '@/lib/utils'
import { getRelativeTimeString, isNew, formatSalesCount } from '@/lib/utils/date'
import ProductPrice from './product-price'

import { useTranslations } from 'next-intl'

interface ProductCardHorizontalProps {
  product: IProduct
  showNewBadge?: boolean
  ranking?: number
  compact?: boolean
}

const ProductCardHorizontal = ({
  product,
  showNewBadge = false,
  ranking,
  compact = false,
}: ProductCardHorizontalProps) => {
  const t = useTranslations('Home')
  
  return (
    <Link href={`/product/${product.slug}`} className='block'>
      <div
        className={`
          flex gap-4 md:gap-5 
          ${compact ? 'p-3 md:p-4' : 'p-5 md:p-6'}
          border border-border rounded-md 
          hover:shadow-lg hover:border-primary/50 hover:scale-[1.01]
          transition-all duration-300
          bg-card
          group
          min-h-[140px] md:min-h-[160px] lg:min-h-[180px]
        `}
      >
        {/* Left: Image Section */}
        <div className='relative w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 flex-shrink-0'>
          <Image
            src={product.images && product.images[0] && product.images[0].trim() !== '' ? product.images[0] : '/placeholder.png'}
            alt={product.name}
            fill
            sizes='(max-width: 768px) 96px, (max-width: 1024px) 128px, 144px'
            className='object-contain group-hover:scale-105 transition-transform duration-300'
          />

          {/* Badges on Image - Bottom left position */}
          <div className='absolute -top-1 left-0 flex flex-row flex-wrap gap-1 max-w-[90%]'>
            {/* Second Hand Badge */}
            {product.secondHand && (
              <Badge className='bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] px-1 py-0 shadow-md rounded'>
                {t('Second Hand')}
              </Badge>
            )}
            
            {/* NEW Badge for New Arrivals */}
            {showNewBadge && product.createdAt && isNew(product.createdAt) && (
              <Badge
                variant='secondary'
                className='bg-green-500 hover:bg-green-600 text-white font-bold text-[10px] px-1 py-0 shadow-md rounded'
              >
                {t('NEW')}
              </Badge>
            )}
          </div>
        </div>

        {/* Right: Content Section */}
        <div className='flex-1 min-w-0 flex flex-col justify-center gap-1 md:gap-1.5'>
          {/* Brand */}
          <p className='text-xs text-muted-foreground uppercase tracking-wide'>
            {typeof product.brand === 'object'
              ? (product.brand as unknown as { name: string }).name
              : product.brand}
          </p>

          {/* Product Name */}
          <h4 className='text-base md:text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors'>
            {product.name}
          </h4>

          {/* Rating */}
          <div className='flex items-center gap-1 text-sm'>
            <Rating rating={product.avgRating} size={14} />
            <span className='text-muted-foreground'>
              ({formatNumber(product.numReviews)})
            </span>
          </div>

          {/* Price Section */}
          <div className='mt-1'>
            <ProductPrice
              price={product.price}
              listPrice={product.listPrice}
              forListing
            />
          </div>

          {/* Additional Info */}
          <div className='flex items-center gap-2 text-sm text-muted-foreground mt-1'>
            {/* Sales count for Best Sellers */}
            {ranking && product.numSales > 0 && (
              <span>{formatSalesCount(product.numSales)} {t('sold')}</span>
            )}

            {/* Relative date for New Arrivals */}
            {showNewBadge && product.createdAt && isNew(product.createdAt) && (
              <span className='text-green-600 dark:text-green-400 font-medium'>
                {getRelativeTimeString(new Date(product.createdAt), t)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ProductCardHorizontal
