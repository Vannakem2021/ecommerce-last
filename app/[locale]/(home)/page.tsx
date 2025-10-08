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
import { getNoCachedSetting } from '@/lib/actions/setting.actions'

import { getTranslations, getLocale } from 'next-intl/server'
import { FEATURED_COLLECTIONS } from '@/lib/constants/collections'

export default async function HomePage() {
  const t = await getTranslations('Home')
  const locale = await getLocale()
  const setting = await getNoCachedSetting() // Use no-cache to get fresh data
  
  // Get flash deals - only show real deals with sale dates
  const flashDeals = await getTodaysDeals({ limit: 10 })
  
  // Get brands with product counts
  const brands = await getAllActiveBrandsWithCounts(11)

  // Get enabled sections sorted by order
  const sections = (setting.homePage?.sections || [])
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)

  // Fetch data for each section based on its type
  const sectionData = await Promise.all(
    sections.map(async (section) => {
      let products = []
      
      switch (section.id) {
        case 'hot-deals':
          products = await getHotDealsForCard({ limit: section.limit })
          break
        case 'new-arrivals':
          products = await getNewArrivalsForCard({ limit: section.limit })
          break
        case 'best-sellers':
          products = await getBestSellersForCard({ limit: section.limit })
          break
        case 'second-hand':
          products = await getSecondHandProductsForCard({ limit: section.limit })
          break
        default:
          // Category sections
          if (section.type === 'category' && section.categoryName) {
            products = await getProductsByCategoryName({ 
              categoryName: section.categoryName, 
              limit: section.limit 
            })
          }
      }
      
      return {
        ...section,
        products,
      }
    })
  )

  // Helper function to get href for sections
  const getHrefForSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hot-deals':
        return '/search?sort=price-high-to-low'
      case 'new-arrivals':
        return '/search?sort=latest'
      case 'best-sellers':
        return '/search?sort=best-selling'
      case 'second-hand':
        return '/search?secondHand=true'
      default:
        return '/search'
    }
  }

  // Prepare card sections (hot-deals, new-arrivals, best-sellers)
  const cardSections = sectionData.filter(s => 
    ['hot-deals', 'new-arrivals', 'best-sellers'].includes(s.id)
  )

  const cards = cardSections.map(section => ({
    title: locale === 'kh' ? section.title.kh : section.title.en,
    items: section.products,
    showNewBadge: section.id === 'new-arrivals',
    showRanking: section.id === 'best-sellers',
    link: {
      text: t('View All'),
      href: getHrefForSection(section.id),
    },
  }))

  // Get category sections (including second-hand)
  const categorySections = sectionData.filter(s => 
    !['hot-deals', 'new-arrivals', 'best-sellers'].includes(s.id) && 
    s.products.length > 0
  )

  return (
    <>
      <HomeCarousel items={setting.carousels} />

      <div className='bg-background'>
        <Container className='md:py-4 md:space-y-4'>
          {flashDeals.length > 0 && <FlashDeals products={flashDeals} />}
          {cards.length > 0 && <HomeCard cards={cards} />}
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
            <BrandGrid brands={brands} maxDisplay={19} />
          </Container>
        </div>
      )}

      {/* Dynamic Category Sections from Settings */}
      {categorySections.length > 0 && (
        <div className='bg-background'>
          <Container className='py-4 md:py-6 space-y-8 md:space-y-10'>
            {categorySections.map((section) => {
              const title = locale === 'kh' ? section.title.kh : section.title.en
              const categorySlug = section.categoryName 
                ? section.categoryName.toLowerCase() 
                : section.id
              
              return (
                <CategorySection
                  key={section.id}
                  title={title}
                  products={section.products}
                  categorySlug={categorySlug}
                />
              )
            })}
          </Container>
        </div>
      )}

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
