import { auth } from '@/auth'
import AddToCart from '@/components/shared/product/add-to-cart'
import { Card, CardContent } from '@/components/ui/card'
import {
  getProductBySlug,
  getRelatedProductsByCategory,
} from '@/lib/actions/product.actions'

import ReviewList from './review-list'
import { generateId, round2 } from '@/lib/utils'
import SelectVariant from '@/components/shared/product/select-variant'
import ProductPrice from '@/components/shared/product/product-price'
import ProductGallery from '@/components/shared/product/product-gallery'
import AddToBrowsingHistory from '@/components/shared/product/add-to-browsing-history'
import { Separator } from '@/components/ui/separator'
import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import RatingSummary from '@/components/shared/product/rating-summary'
import ProductSlider from '@/components/shared/product/product-slider'
import PromotionBadge from '@/components/shared/promotion/promotion-badge'
import { getTranslations } from 'next-intl/server'
import FavoriteButton from '@/components/shared/product/favorite-button'
import ProductDetailClient from './product-detail-client'

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}) {
  const t = await getTranslations()
  const params = await props.params
  const product = await getProductBySlug(params.slug)
  if (!product) {
    return { title: t('Product.Product not found') }
  }
  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductDetails(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page: string; color: string; size: string }>
}) {
  const searchParams = await props.searchParams

  const { page, color, size } = searchParams

  const params = await props.params

  const { slug } = params

  const session = await auth()

  const product = await getProductBySlug(slug)

  const relatedProducts = await getRelatedProductsByCategory({
    category: typeof product.category === 'object' ? (product.category as unknown as { _id: string })._id : product.category,
    productId: product._id,
    page: Number(page || '1'),
  })

  const t = await getTranslations()
  return (
    <div>
      <AddToBrowsingHistory id={product._id} category={typeof product.category === 'object' ? (product.category as unknown as { name: string }).name : product.category} />
      <section>
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
          <div className='col-span-2'>
            <ProductGallery images={product.images} />
          </div>

          <div className='flex w-full flex-col gap-2 md:p-5 col-span-3'>
            <div className='flex flex-col gap-3'>
              <p className='p-medium-16 rounded-full bg-grey-500/10   text-grey-500'>
                {t('Product.Brand')} {typeof product.brand === 'object' ? (product.brand as unknown as { name: string }).name : product.brand} {typeof product.category === 'object' ? (product.category as unknown as { name: string }).name : product.category}
              </p>
              <div className='flex items-start justify-between gap-2'>
                <h1 className='font-bold text-lg lg:text-xl'>{product.name}</h1>
                <FavoriteButton productId={product._id} />
              </div>

              <RatingSummary
                avgRating={product.avgRating}
                numReviews={product.numReviews}
                asPopover
                ratingDistribution={product.ratingDistribution}
              />
              <Separator />
              {/* Promotion Badges */}
              <PromotionBadge
                productId={product._id}
                categoryId={typeof product.category === 'object' ? (product.category as unknown as { _id: string })._id : product.category}
                size='lg'
                className='mb-2'
              />
            </div>
            
            <Separator className='my-2' />
            
            {/* Variant Selection & Pricing */}
            <ProductDetailClient 
              product={product} 
              translations={{
                inStock: t('Product.In Stock'),
                outOfStock: t('Product.Out of Stock'),
                onlyXLeft: t('Product.Only X left in stock - order soon', { count: product.countInStock })
              }}
            />
            
            <Separator className='my-2' />
            <div className='flex flex-col gap-2'>
              <p className='p-bold-20 text-grey-600'>
                {t('Product.Description')}:
              </p>
              <p className='p-medium-16 lg:p-regular-18'>
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className='mt-10'>
        <h2 className='h2-bold mb-2' id='reviews'>
          {t('Product.Customer Reviews')}
        </h2>
        <ReviewList product={product} userId={session?.user.id} />
      </section>
      <section className='mt-10'>
        <ProductSlider
          products={relatedProducts.data}
          title={t('Product.Best Sellers in', { name: typeof product.category === 'object' ? (product.category as unknown as { name: string }).name : product.category })}
        />
      </section>
      <section>
        <BrowsingHistoryList className='mt-10' />
      </section>
    </div>
  )
}
