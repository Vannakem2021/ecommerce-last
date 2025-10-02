import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import { HomeCard } from '@/components/shared/home/home-card'
import { HomeCarousel } from '@/components/shared/home/home-carousel'
import { FlashDeals } from '@/components/shared/home/flash-deals'
import PromotionBanner from '@/components/shared/promotion/promotion-banner'
import Container from '@/components/shared/container'

import {
  getProductsForCard,
  getAllCategoriesWithCounts,
  getNewArrivalsForCard,
  getBestSellersForCard,
  getTodaysDeals,
} from '@/lib/actions/product.actions'
import { getSetting } from '@/lib/actions/setting.actions'
import { toSlug } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'

export default async function HomePage() {
  const t = await getTranslations('Home')
  const { carousels } = await getSetting()
  const todaysDeals = await getTodaysDeals({ limit: 10 })

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
          <FlashDeals products={todaysDeals} />
          <HomeCard cards={cards} />
        </Container>
      </div>

      <div className='bg-secondary/30'>
        <Container className='py-4'>
          <BrowsingHistoryList />
        </Container>
      </div>
    </>
  )
}
