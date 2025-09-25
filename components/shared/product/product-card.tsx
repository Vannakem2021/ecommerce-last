import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { IProduct } from '@/lib/db/models/product.model'

import Rating from './rating'
import { formatNumber, generateId, round2 } from '@/lib/utils'
import ProductPrice from './product-price'
import ImageHover from './image-hover'
import AddToCart from './add-to-cart'
import PromotionBadge from '../promotion/promotion-badge'
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
      <p className='font-bold'>{typeof product.brand === 'object' ? product.brand.name : product.brand}</p>
      <Link
        href={`/product/${product.slug}`}
        className='overflow-hidden text-ellipsis'
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {product.name}
      </Link>
      <div className='flex gap-2 justify-center'>
        <Rating rating={product.avgRating} />
        <span>({formatNumber(product.numReviews)})</span>
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
          category: typeof product.category === 'object' ? product.category.name : product.category,
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
          <div className='p-3 flex-1 text-center'>
            <ProductDetails />
          </div>
          {!hideAddToCart && <AddButton />}
        </>
      )}
    </div>
  ) : (
    <Card className='flex flex-col bg-card border-border'>
      <CardHeader className='p-3'>
        <ProductImage />
      </CardHeader>
      {!hideDetails && (
        <>
          <CardContent className='p-3 flex-1  text-center'>
            <ProductDetails />
          </CardContent>
          <CardFooter className='p-3'>
            {!hideAddToCart && <AddButton />}
          </CardFooter>
        </>
      )}
    </Card>
  )
}

export default ProductCard
