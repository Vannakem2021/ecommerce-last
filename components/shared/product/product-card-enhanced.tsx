import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IProduct } from '@/lib/db/models/product.model'

import Rating from './rating'
import { formatNumber, generateId, round2 } from '@/lib/utils'
import { getRelativeTimeString, isNew, formatSalesCount } from '@/lib/utils/date'
import ProductPrice from './product-price'
import ImageHover from './image-hover'
import AddToCart from './add-to-cart'
import FavoriteButton from './favorite-button'
import { Trophy } from 'lucide-react'
import { useTranslations } from 'next-intl'

const ProductCardEnhanced = ({
  product,
  hideBorder = false,
  hideDetails = false,
  hideAddToCart = false,
  onFavoriteToggleStart,
  onFavoriteToggleError,
  onFavoriteToggled,
  favoriteButtonSubmit = false,
  favoriteButtonControlled = false,
  showNewBadge = false,
  ranking,
}: {
  product: IProduct
  hideDetails?: boolean
  hideBorder?: boolean
  hideAddToCart?: boolean
  onFavoriteToggleStart?: (args: { productId: string; nextActive: boolean }) => void
  onFavoriteToggleError?: (args: { productId: string; error?: unknown }) => void
  onFavoriteToggled?: (args: { productId: string; isFavorite: boolean; success: boolean; message: string }) => void
  favoriteButtonSubmit?: boolean
  favoriteButtonControlled?: boolean
  showNewBadge?: boolean
  ranking?: number
}) => {
  const t = useTranslations('Home')
  
  const ProductImage = () => {
    // Filter valid images
    const validImages = product.images.filter(img => img && img.trim() !== '')
    const hasImage = validImages.length > 0
    const imageUrl = hasImage ? validImages[0] : '/placeholder.png'
    
    return (
      <Link href={`/product/${product.slug}`}>
        <div className='relative h-52'>
          {validImages.length > 1 ? (
            <ImageHover
              src={validImages[0]}
              hoverSrc={validImages[1]}
              alt={product.name}
            />
          ) : (
            <div className='relative h-52'>
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                sizes='80vw'
                className='object-contain'
              />
            </div>
          )}
          <div className='absolute top-2 right-2 z-10'>
          <FavoriteButton 
            productId={product._id}
            onToggleStart={onFavoriteToggleStart}
            onToggleError={onFavoriteToggleError}
            onToggled={onFavoriteToggled}
            type={favoriteButtonSubmit ? 'submit' : 'button'}
            useInternalToggle={!favoriteButtonControlled}
          />
        </div>
        
        {/* Badges */}
        <div className='absolute top-2 left-2 z-10 flex flex-col gap-1'>
          {/* Ranking Badge for Best Sellers */}
          {ranking && ranking <= 3 && (
            <Badge 
              variant={ranking === 1 ? 'default' : 'secondary'}
              className={`
                ${ranking === 1 ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''}
                flex items-center gap-1 font-bold
              `}
            >
              {ranking === 1 && <Trophy className='h-3 w-3' />}
              #{ranking}
            </Badge>
          )}
          
          {/* NEW Badge for New Arrivals */}
          {showNewBadge && product.createdAt && isNew(product.createdAt) && (
            <Badge variant='secondary' className='bg-green-500 hover:bg-green-600 text-white font-bold'>
              {t('NEW')}
            </Badge>
          )}
        </div>
      </div>
    </Link>
    )
  }
  
  const ProductDetails = () => (
    <div className='flex-1 space-y-3'>
      {/* Brand - smaller, muted */}
      <p className='text-xs text-muted-foreground uppercase tracking-wide'>
        {typeof product.brand === 'object' ? (product.brand as unknown as { name: string }).name : product.brand}
      </p>

      {/* Product Name - larger, bold */}
      <Link
        href={`/product/${product.slug}`}
        className='overflow-hidden text-ellipsis font-semibold text-sm hover:text-primary transition-colors'
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {product.name}
      </Link>

      {/* Rating - single line, smaller */}
      <div className='flex gap-1 justify-center items-center text-xs'>
        <Rating rating={product.avgRating} size={12} />
        <span className='text-muted-foreground'>({formatNumber(product.numReviews)})</span>
      </div>

      {/* Additional Info */}
      <div className='flex flex-col gap-1 mt-2'>
        {/* Relative date for new products */}
        {showNewBadge && product.createdAt && isNew(product.createdAt) && (
          <p className='text-xs text-green-600 dark:text-green-400 font-medium'>
            {getRelativeTimeString(new Date(product.createdAt), t)}
          </p>
        )}
        
        {/* Sales count for best sellers */}
        {ranking && product.numSales > 0 && (
          <p className='text-xs text-muted-foreground'>
            {formatSalesCount(product.numSales)} {t('sold')}
          </p>
        )}
      </div>
    </div>
  )
  
  const AddButton = () => (
    <div className='w-full flex items-center justify-between gap-3'>
      {/* Price */}
      <ProductPrice
        price={product.price}
        listPrice={product.listPrice}
        forListing
      />
      
      {/* Cart Icon Button */}
      <AddToCart
        minimal
        iconOnly
        item={{
          clientId: generateId(),
          product: product._id,
          size: product.sizes[0],
          color: product.colors[0],
          countInStock: product.countInStock,
          name: product.name,
          slug: product.slug,
          category: typeof product.category === 'object' ? (product.category as unknown as { name: string }).name : product.category,
          price: round2(product.price),
          quantity: 1,
          image: product.images && product.images[0] && product.images[0].trim() !== '' ? product.images[0] : '/placeholder.png',
        }}
      />
    </div>
  )

  return hideBorder ? (
    <div className='flex flex-col'>
      <ProductImage />
      {!hideDetails && (
        <>
          <div className='p-5 flex-1 text-center'>
            <ProductDetails />
          </div>
          {!hideAddToCart && <div className='px-5 pb-5'><AddButton /></div>}
        </>
      )}
    </div>
  ) : (
    <Card className='flex flex-col bg-card border border-border hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 rounded-md'>
      <CardHeader className='p-5'>
        <ProductImage />
      </CardHeader>
      {!hideDetails && (
        <>
          <CardContent className='px-5 py-4 flex-1 text-center'>
            <ProductDetails />
          </CardContent>
          <CardFooter className='px-5 pb-5 pt-2'>
            {!hideAddToCart && <AddButton />}
          </CardFooter>
        </>
      )}
    </Card>
  )
}

export default ProductCardEnhanced
