import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import { HomeCard } from '@/components/shared/home/home-card'
import { HomeCarousel } from '@/components/shared/home/home-carousel'
import ProductSlider from '@/components/shared/product/product-slider'
import PromotionBanner from '@/components/shared/promotion/promotion-banner'
import { Card, CardContent } from '@/components/ui/card'
import Container from '@/components/shared/container'

import {
  getProductsForCard,
  getAllCategories,
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

  const categories = (await getAllCategories()).slice(0, 4)
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
      items: categories.map((category) => ({
        name: category,
        image: `/images/${toSlug(category)}.jpg`,
        href: `/search?category=${category}`,
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

      {/* Promotion Banners */}
      <div className='bg-secondary/30'>
        <Container className='py-4'>
          <PromotionBanner limit={2} />
        </Container>
      </div>

      <div className='bg-background'>
        <Container className='md:py-4 md:space-y-4'>
          <HomeCard cards={cards} />
          <Card className='w-full rounded-none bg-card border-border'>
            <CardContent className='p-4 items-center gap-3'>
              <ProductSlider title={t("Today's Deals")} products={todaysDeals} />
            </CardContent>
          </Card>
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
