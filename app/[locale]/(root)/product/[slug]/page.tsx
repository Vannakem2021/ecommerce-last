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
import Breadcrumbs from '@/components/shared/breadcrumbs'
import ProductTabs from '@/components/shared/product/product-tabs'
import KeyFeatures from '@/components/shared/product/key-features'
import SpecificationsTable from '@/components/shared/product/specifications-table'

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
  
  // Prepare breadcrumb items
  const categoryName = typeof product.category === 'object' 
    ? (product.category as unknown as { name: string }).name 
    : product.category
  
  return (
    <div>
      <AddToBrowsingHistory id={product._id} category={categoryName} />
      
      {/* Breadcrumbs */}
      <div className='py-4'>
        <Breadcrumbs
          items={[
            { label: t('Header.All'), href: '/' },
            { label: categoryName, href: `/search?category=${categoryName}` },
            { label: product.name, href: '#' },
          ]}
        />
      </div>
      
      <section>
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
          <div className='col-span-2'>
            <ProductGallery images={product.images} />
          </div>

          <div className='flex w-full flex-col gap-4 md:p-5 col-span-3'>
            {/* Product Title & Favorite - Larger and more prominent */}
            <div className='flex items-start justify-between gap-2'>
              <div className='flex-1'>
                <h1 className='font-bold text-2xl lg:text-3xl mb-2'>{product.name}</h1>
                <p className='text-sm text-muted-foreground'>
                  {t('Product.Brand')}: {typeof product.brand === 'object' ? (product.brand as unknown as { name: string }).name : product.brand} | 
                  {' '}{typeof product.category === 'object' ? (product.category as unknown as { name: string }).name : product.category}
                </p>
              </div>
              <FavoriteButton productId={product._id} />
            </div>

            {/* Rating - More prominent */}
            <RatingSummary
              avgRating={product.avgRating}
              numReviews={product.numReviews}
              asPopover
              ratingDistribution={product.ratingDistribution}
            />
            
            {/* Promotion Badges */}
            <PromotionBadge
              productId={product._id}
              categoryId={typeof product.category === 'object' ? (product.category as unknown as { _id: string })._id : product.category}
              size='lg'
            />
            
            <Separator />
            
            {/* Variant Selection & Pricing */}
            <ProductDetailClient 
              product={product} 
              translations={{
                inStock: t('Product.In Stock'),
                outOfStock: t('Product.Out of Stock'),
                lowStock: t('Product.Low Stock'),
                onlyXLeft: t('Product.Only X left in stock - order soon', { count: product.countInStock }),
                quantity: t('Product.Quantity'),
                max: t('Product.Max'),
                taxIncluded: t('Product.Tax included'),
                freeShipping: t('Product.Free shipping'),
              }}
            />
          </div>
        </div>
      </section>
      
      {/* Product Information Tabs */}
      <section className='mt-10'>
        <ProductTabs
          defaultTab='overview'
          tabs={[
            {
              value: 'overview',
              label: t('Product.Overview'),
              content: (
                <div className='space-y-6'>
                  {/* Key Features */}
                  <KeyFeatures
                    title={t('Product.Key Features')}
                    features={[
                      product.name.includes('iPhone') || product.name.includes('Pro') 
                        ? 'Advanced A17 Pro chip for lightning-fast performance'
                        : 'High-performance processor',
                      'Premium build quality with durable materials',
                      'Stunning display with vibrant colors',
                      'Long-lasting battery life for all-day use',
                      'Advanced camera system for professional photos',
                    ]}
                  />
                  
                  <Separator />
                  
                  {/* Description */}
                  <div className='space-y-3'>
                    <h3 className='text-lg font-semibold'>
                      {t('Product.Description')}
                    </h3>
                    <p className='text-sm text-muted-foreground leading-relaxed'>
                      {product.description}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              value: 'specifications',
              label: t('Product.Specifications'),
              content: (
                <SpecificationsTable
                  title={t('Product.Technical Specifications')}
                  specifications={[
                    {
                      title: 'General',
                      specs: [
                        { label: 'Brand', value: typeof product.brand === 'object' ? (product.brand as unknown as { name: string }).name : product.brand },
                        { label: 'Category', value: typeof product.category === 'object' ? (product.category as unknown as { name: string }).name : product.category },
                        { label: 'Condition', value: product.isSecondHand ? t('Condition.Second Hand') : t('Condition.New') },
                      ],
                    },
                  ]}
                />
              ),
            },
            {
              value: 'reviews',
              label: t('Product.Customer Reviews'),
              content: (
                <div id='reviews'>
                  <ReviewList product={product} userId={session?.user.id} />
                </div>
              ),
            },
          ]}
        />
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
