import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IProduct } from '@/lib/db/models/product.model'

import Rating from './rating'
import { formatNumber, generateId, round2, getProductPriceRange } from '@/lib/utils'
import ProductPrice from './product-price'
import ImageHover from './image-hover'
import AddToCart from './add-to-cart'
import FavoriteButton from './favorite-button'
import { useTranslations } from 'next-intl'

const ProductCard = ({
  product,
  hideBorder = false,
  hideDetails = false,
  hideAddToCart = false,
  onFavoriteToggleStart,
  onFavoriteToggleError,
  onFavoriteToggled,
  favoriteButtonSubmit = false,
  favoriteButtonControlled = false,
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
}) => {
  const t = useTranslations('Home')
  
  const ProductImage = () => {
    // Filter valid images
    const validImages = product.images.filter(img => img && img.trim() !== '')
    const hasImage = validImages.length > 0
    const imageUrl = hasImage ? validImages[0] : '/placeholder.png'
    
    return (
      <Link href={`/product/${product.slug}`}>
        <div className='relative h-48 md:h-52'>
          {validImages.length > 1 ? (
            <ImageHover
              src={validImages[0]}
              hoverSrc={validImages[1]}
              alt={product.name}
            />
          ) : (
            <div className='relative h-48 md:h-52'>
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                sizes='(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw'
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
        {product.secondHand && (
          <div className='absolute top-2 left-2 z-10'>
            <Badge className='bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs px-2 py-0.5'>
              {t('Second Hand')}
            </Badge>
          </div>
        )}
        {/* Promotion Badge - Disabled in product cards to reduce server action calls */}
        {/* <div className='absolute top-2 left-2 z-10'>
          <PromotionBadge
            productId={product._id}
            categoryId={typeof product.category === 'object' ? product.category._id : product.category}
            size='sm'
          />
        </div> */}
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
    </div>
  )
  const AddButton = () => {
    // Calculate price range for products with variants
    const priceRange = getProductPriceRange(product)
    
    return (
      <div className='w-full flex items-center justify-between gap-3'>
        {/* Price */}
        {priceRange.hasRange ? (
          <div className="flex flex-col items-start">
            <ProductPrice
              price={priceRange.min}
              listPrice={product.listPrice}
              forListing
            />
            <span className="text-xs text-muted-foreground">Starting at</span>
          </div>
        ) : (
          <ProductPrice
            price={product.price}
            listPrice={product.listPrice}
            forListing
          />
        )}
        
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
  }

  return hideBorder ? (
    <div className='flex flex-col h-full'>
      <ProductImage />
      {!hideDetails ? (
        <>
          <div className='p-5 flex-1 text-center'>
            <ProductDetails />
          </div>
          {!hideAddToCart && <div className='px-5 pb-5'><AddButton /></div>}
        </>
      ) : (
        <div className='p-3 text-center space-y-2'>
          <Link
            href={`/product/${product.slug}`}
            className='text-sm font-medium hover:text-primary transition-colors line-clamp-2 block'
          >
            {product.name}
          </Link>
          <ProductPrice
            price={product.price}
            listPrice={product.listPrice}
            forListing
          />
        </div>
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

export default ProductCard
