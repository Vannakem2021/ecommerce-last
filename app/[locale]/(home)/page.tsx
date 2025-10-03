import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import { HomeCardEnhanced as HomeCard } from '@/components/shared/home/home-card-enhanced'
import { HomeCarousel } from '@/components/shared/home/home-carousel'
import { FlashDeals } from '@/components/shared/home/flash-deals'
import { BrandGrid } from '@/components/shared/home/brand-grid'
import { FeaturedCollections } from '@/components/shared/home/featured-collections'
import { CategorySection } from '@/components/shared/home/category-section'
import Container from '@/components/shared/container'

import {
  getNewArrivalsForCard,
  getBestSellersForCard,
  getTodaysDeals,
  getHotDealsForCard,
  getProductsByCategoryName,
  getSecondHandProductsForCard,
} from '@/lib/actions/product.actions'
import { getAllActiveBrandsWithCounts } from '@/lib/actions/brand.actions'
import { getSetting } from '@/lib/actions/setting.actions'

import { getTranslations } from 'next-intl/server'
import { FEATURED_COLLECTIONS } from '@/lib/constants/collections'

export default async function HomePage() {
  const t = await getTranslations('Home')
  const { carousels } = await getSetting()
  // Get flash deals - only show real deals with sale dates
  const flashDeals = await getTodaysDeals({ limit: 10 })
  // Get brands with product counts
  const brands = await getAllActiveBrandsWithCounts(11)

  const newArrivals = await getNewArrivalsForCard({ limit: 3 })
  const bestSellers = await getBestSellersForCard({ limit: 3 })
  const hotDeals = await getHotDealsForCard({ limit: 3 })
  
  // Get products by category for category sections
  const smartphoneProducts = await getProductsByCategoryName({ categoryName: 'Smartphones', limit: 6 })
  const laptopProducts = await getProductsByCategoryName({ categoryName: 'Laptops', limit: 6 })
  const tabletProducts = await getProductsByCategoryName({ categoryName: 'Tablets', limit: 6 })
  const secondHandProducts = await getSecondHandProductsForCard({ limit: 6 })
  const cards = [
    {
      title: t('Discover Hot Deals'),
      items: hotDeals,
      link: {
        text: t('View All'),
        href: '/search?sort=price-high-to-low',
      },
    },
    {
      title: t('Explore New Arrivals'),
      items: newArrivals,
      showNewBadge: true,
      link: {
        text: t('View All'),
        href: '/search?sort=latest',
      },
    },
    {
      title: t('Discover Best Sellers'),
      items: bestSellers,
      showRanking: true,
      link: {
        text: t('View All'),
        href: '/search?sort=best-selling',
      },
    },
  ]

  return (
    <>
      <HomeCarousel items={carousels} />

      <div className='bg-background'>
        <Container className='md:py-4 md:space-y-4'>
          {flashDeals.length > 0 && <FlashDeals products={flashDeals} />}
          <HomeCard cards={cards} />
        </Container>
      </div>

      {/* Shop by Brand Section */}
      {brands.length > 0 && (
        <div className='bg-secondary/30'>
          <Container className='py-4 md:py-6'>
            <div className='mb-4'>
              <h2 className='h2-bold mb-2'>{t('Shop by Brand')}</h2>
              <div className='h-[3px] w-16 bg-primary rounded-full'></div>
            </div>
            <BrandGrid brands={brands} maxDisplay={11} />
          </Container>
        </div>
      )}

      {/* Category Sections - Smartphones, Laptops, Tablets */}
      <div className='bg-background'>
        <Container className='py-4 md:py-6 space-y-8 md:space-y-10'>
          {smartphoneProducts.length > 0 && (
            <CategorySection
              title={t('Smartphones')}
              products={smartphoneProducts}
              categorySlug='smartphones'
            />
          )}
          
          {laptopProducts.length > 0 && (
            <CategorySection
              title={t('Laptops')}
              products={laptopProducts}
              categorySlug='laptops'
            />
          )}
          
          {tabletProducts.length > 0 && (
            <CategorySection
              title={t('Tablets')}
              products={tabletProducts}
              categorySlug='tablets'
            />
          )}
          
          {secondHandProducts.length > 0 && (
            <CategorySection
              title={t('Second Hand')}
              products={secondHandProducts}
              categorySlug='second-hand'
            />
          )}
        </Container>
      </div>

      {/* Featured Collections Section */}
      {FEATURED_COLLECTIONS.length > 0 && (
        <div className='bg-background'>
          <Container className='py-4 md:py-6'>
            <div className='mb-4'>
              <h2 className='h2-bold mb-2'>{t('Featured Collections')}</h2>
              <div className='h-[3px] w-16 bg-primary rounded-full'></div>
            </div>
            <FeaturedCollections collections={FEATURED_COLLECTIONS} />
          </Container>
        </div>
      )}

      <div className='bg-secondary/30'>
        <Container className='py-4'>
          <BrowsingHistoryList />
        </Container>
      </div>
    </>
  )
}
