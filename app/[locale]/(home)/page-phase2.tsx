import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import { HomeCard } from '@/components/shared/home/home-card'
import { HomeCarousel } from '@/components/shared/home/home-carousel'
import { FlashDeals } from '@/components/shared/home/flash-deals'
import { BrandGrid } from '@/components/shared/home/brand-grid'
import { FeaturedCollections } from '@/components/shared/home/featured-collections'
import Container from '@/components/shared/container'

import {
  getProductsForCard,
  getAllCategoriesWithCounts,
  getNewArrivalsForCard,
  getBestSellersForCard,
  getTodaysDeals,
} from '@/lib/actions/product.actions'
import { getAllActiveBrandsWithCounts } from '@/lib/actions/brand.actions'
import { getSetting } from '@/lib/actions/setting.actions'
import { toSlug } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'
import { FEATURED_COLLECTIONS } from '@/lib/constants/collections'

export default async function HomePage() {
  const t = await getTranslations('Home')
  const { carousels } = await getSetting()
  // Get flash deals - only show real deals with sale dates
  const flashDeals = await getTodaysDeals({ limit: 10 })
  // Get brands with product counts
  const brands = await getAllActiveBrandsWithCounts(11)

  const categoriesWithCounts = (await getAllCategoriesWithCounts()).slice(0, 4)
  const newArrivals = await getNewArrivalsForCard({ limit: 4 })
  const featureds = await getProductsForCard({
    tag: 'featured',
  })
  const bestSellers = await getBestSellersForCard({ limit: 4 })
  const cards = [
    {
      title: t('Categories to explore'),
      link: {
        text: t('See More'),
        href: '/search',
      },
      items: categoriesWithCounts.map((category) => ({
        name: category.name,
        image: `/images/${toSlug(category.name)}.jpg`,
        href: `/search?category=${category.name}`,
        count: category.count,
      })),
    },
    {
      title: t('Explore New Arrivals'),
      items: newArrivals,
      link: {
        text: t('View All'),
        href: '/search?sort=latest',
      },
    },
    {
      title: t('Discover Best Sellers'),
      items: bestSellers,
      link: {
        text: t('View All'),
        href: '/search?sort=best-selling',
      },
    },
    {
      title: t('Featured Products'),
      items: featureds,
      link: {
        text: t('Shop Now'),
        href: '/search?tag=featured',
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
            <div className='flex items-center justify-between mb-4'>
              <h2 className='h2-bold'>{t('Shop by Brand')}</h2>
            </div>
            <BrandGrid brands={brands} maxDisplay={11} />
          </Container>
        </div>
      )}

      {/* Featured Collections Section */}
      {FEATURED_COLLECTIONS.length > 0 && (
        <div className='bg-background'>
          <Container className='py-4 md:py-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='h2-bold'>{t('Featured Collections')}</h2>
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
