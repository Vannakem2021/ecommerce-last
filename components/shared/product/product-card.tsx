import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IProduct } from '@/lib/db/models/product.model'

import Rating from './rating'
import { formatNumber, generateId, round2 } from '@/lib/utils'
import ProductPrice from './product-price'
import ImageHover from './image-hover'
import AddToCart from './add-to-cart'
import FavoriteButton from './favorite-button'

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
  const ProductImage = () => (
    <Link href={`/product/${product.slug}`}>
      <div className='relative h-52'>
        {product.images.length > 1 ? (
          <ImageHover
            src={product.images[0]}
            hoverSrc={product.images[1]}
            alt={product.name}
          />
        ) : (
          <div className='relative h-52'>
            <Image
              src={product.images[0]}
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
        {product.secondHand && (
          <div className='absolute top-2 left-2 z-10'>
            <Badge className='bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs px-2 py-0.5'>
              Second Hand
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
  const ProductDetails = () => (
    <div className='flex-1 space-y-2'>
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

      <ProductPrice
        price={product.price}
        listPrice={product.listPrice}
        forListing
      />
    </div>
  )
  const AddButton = () => (
    <div className='w-full text-center'>
      <AddToCart
        minimal
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
          image: product.images[0],
        }}
      />
    </div>
  )

  return hideBorder ? (
    <div className='flex flex-col'>
      <ProductImage />
      {!hideDetails && (
        <>
          <div className='p-4 flex-1 text-center'>
            <ProductDetails />
          </div>
          {!hideAddToCart && <div className='px-4 pb-4'><AddButton /></div>}
        </>
      )}
    </div>
  ) : (
    <Card className='flex flex-col bg-card border-border hover:shadow-lg transition-shadow'>
      <CardHeader className='p-4'>
        <ProductImage />
      </CardHeader>
      {!hideDetails && (
        <>
          <CardContent className='px-4 py-3 flex-1 text-center'>
            <ProductDetails />
          </CardContent>
          <CardFooter className='px-4 pb-4 pt-2'>
            {!hideAddToCart && <AddButton />}
          </CardFooter>
        </>
      )}
    </Card>
  )
}

export default ProductCard
