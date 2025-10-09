import Link from 'next/link'

import Pagination from '@/components/shared/pagination'
import ProductCard from '@/components/shared/product/product-card'
import PromotionBanner from '@/components/shared/promotion/promotion-banner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getAllCategories,
  getAllProducts,
} from '@/lib/actions/product.actions'
import { IProduct } from '@/lib/db/models/product.model'
import ProductSortSelector from '@/components/shared/product/product-sort-selector'
import { getFilterUrl } from '@/lib/utils'
import { X } from 'lucide-react'

import { getTranslations } from 'next-intl/server'
import Breadcrumbs from '@/components/shared/breadcrumbs'
import MobileFilterDrawer from '@/components/shared/search/mobile-filter-drawer'
import PriceRangeSlider from '@/components/shared/search/price-range-slider'

const sortOrders = [
  { value: 'price-low-to-high', name: 'Price: Low to high' },
  { value: 'price-high-to-low', name: 'Price: High to low' },
  { value: 'latest', name: 'Newest arrivals' },
  { value: 'avg-customer-review', name: 'Avg. customer review' },
  { value: 'best-selling', name: 'Best selling' },
]

const prices = [
  {
    name: '$1 to $20',
    value: '1-20',
  },
  {
    name: '$21 to $50',
    value: '21-50',
  },
  {
    name: '$51 to $1000',
    value: '51-1000',
  },
]

export async function generateMetadata(props: {
  searchParams: Promise<{
    q: string
    category: string
    tag: string
    price: string
    sort: string
    page: string
    secondHand: string
    discount: string
  }>
}) {
  const searchParams = await props.searchParams
  const t = await getTranslations()
  const {
    q = 'all',
    category = 'all',
    price = 'all',
  } = searchParams

  if (
    (q !== 'all' && q !== '') ||
    category !== 'all' ||
    price !== 'all'
  ) {
    return {
      title: `${t('Search.Search')} ${q !== 'all' ? q : ''}
          ${category !== 'all' ? ` : ${t('Search.Category')} ${category}` : ''}
          ${price !== 'all' ? ` : ${t('Search.Price')} ${price}` : ''}`,
    }
  } else {
    return {
      title: t('Search.Search Products'),
    }
  }
}

export default async function SearchPage(props: {
  searchParams: Promise<{
    q: string
    category: string
    tag: string
    price: string
    sort: string
    page: string
    secondHand: string
    discount: string
  }>
}) {
  const searchParams = await props.searchParams

  const {
    q = 'all',
    category = 'all',
    tag = 'all',
    price = 'all',
    sort = 'best-selling',
    page = '1',
    secondHand = 'all',
    discount = 'all',
  } = searchParams

  const params = { q, category, tag, price, sort, page, secondHand, discount }

  const categories = await getAllCategories()
  const data = await getAllProducts({
    category,
    tag,
    query: q,
    price,
    page: Number(page),
    sort,
    secondHand,
    discount,
  })
  const t = await getTranslations()
  
  // Check if any filters are active
  const hasActiveFilters =
    (q !== 'all' && q !== '') ||
    (category !== 'all' && category !== '') ||
    price !== 'all' ||
    secondHand !== 'all' ||
    discount !== 'all'

  // Count active filters for mobile drawer badge
  let activeFiltersCount = 0
  if (q !== 'all' && q !== '') activeFiltersCount++
  if (category !== 'all' && category !== '') activeFiltersCount++
  if (price !== 'all') activeFiltersCount++
  if (secondHand !== 'all') activeFiltersCount++
  if (discount !== 'all') activeFiltersCount++

  // Build breadcrumbs
  const breadcrumbItems = []
  breadcrumbItems.push({ label: t('Search.Search'), href: '/search' })
  if (category !== 'all' && category !== '') {
    breadcrumbItems.push({ label: category })
  } else if (q !== 'all' && q !== '') {
    breadcrumbItems.push({ label: `"${q}"` })
  }

  return (
    <div>
      {/* Breadcrumbs Navigation */}
      <div className='bg-card p-4 border-b'>
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Clean Results Header */}
      <div className='my-2 bg-card md:border-b flex-between flex-col md:flex-row p-4'>
        <div className='flex items-center gap-2'>
          <span className='font-semibold'>
            {data.totalProducts === 0
              ? t('Search.No results')
              : `${data.totalProducts} ${t('Search.Results')}`}
          </span>
        </div>
        <div>
          <ProductSortSelector
            sortOrders={sortOrders}
            sort={sort}
            params={params}
          />
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className='bg-muted/30 p-4 border-b'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-sm font-medium text-muted-foreground mr-2'>
              {t('Search.Active Filters')}:
            </span>
            
            {q !== 'all' && q !== '' && (
              <Badge variant='secondary' className='gap-1.5'>
                {t('Search.Search')}: &quot;{q}&quot;
                <Link href={getFilterUrl({ params, q: 'all' })}>
                  <X className='h-3 w-3 cursor-pointer hover:text-destructive' />
                </Link>
              </Badge>
            )}
            
            {category !== 'all' && category !== '' && (
              <Badge variant='secondary' className='gap-1.5'>
                {t('Search.Category')}: {category}
                <Link href={getFilterUrl({ params, category: 'all' })}>
                  <X className='h-3 w-3 cursor-pointer hover:text-destructive' />
                </Link>
              </Badge>
            )}
            
            {price !== 'all' && (
              <Badge variant='secondary' className='gap-1.5'>
                {t('Search.Price')}: ${price}
                <Link href={getFilterUrl({ params, price: 'all' })}>
                  <X className='h-3 w-3 cursor-pointer hover:text-destructive' />
                </Link>
              </Badge>
            )}
            
            {secondHand === 'true' && (
              <Badge variant='secondary' className='gap-1.5'>
                {t('Search.Second Hand')}
                <Link href={getFilterUrl({ params, secondHand: 'all' })}>
                  <X className='h-3 w-3 cursor-pointer hover:text-destructive' />
                </Link>
              </Badge>
            )}

            {secondHand === 'false' && (
              <Badge variant='secondary' className='gap-1.5'>
                {t('Search.New Products')}
                <Link href={getFilterUrl({ params, secondHand: 'all' })}>
                  <X className='h-3 w-3 cursor-pointer hover:text-destructive' />
                </Link>
              </Badge>
            )}
            
            {discount === 'true' && (
              <Badge variant='secondary' className='gap-1.5'>
                🔥 {t('Home.Hot Deals')}
                <Link href={getFilterUrl({ params, discount: 'all' })}>
                  <X className='h-3 w-3 cursor-pointer hover:text-destructive' />
                </Link>
              </Badge>
            )}
            
            <Button variant='ghost' size='sm' asChild className='h-7'>
              <Link href='/search'>{t('Search.Clear All')}</Link>
            </Button>
          </div>
        </div>
      )}
      <div className='bg-card grid md:grid-cols-5 md:gap-4 p-4'>
        {/* Mobile Filter Drawer Button */}
        <div className='md:hidden mb-4'>
          <MobileFilterDrawer 
            title={t('Search.Filters')} 
            activeFiltersCount={activeFiltersCount}
          >
            <div className='space-y-6'>
            <div className='flex items-center justify-between pb-2 border-b'>
              <h3 className='font-bold text-sm uppercase tracking-wide'>
                {t('Search.Filters')}
              </h3>
              {(category !== 'all' ||
                price !== 'all' ||
                tag !== 'all' ||
                secondHand !== 'all' ||
                discount !== 'all') && (
                <Button variant='link' size='sm' asChild className='h-auto p-0'>
                  <Link href='/search'>{t('Search.Clear All')}</Link>
                </Button>
              )}
            </div>

            {/* Discount Filter */}
            <div>
              <div className='font-semibold mb-3'>{t('Search.Special Offers')}</div>
              <div className='space-y-2'>
                <Link
                  href={getFilterUrl({ discount: 'all', params })}
                  className='flex items-center gap-2 hover:text-primary transition-colors'
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      'all' === discount || '' === discount
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {('all' === discount || '' === discount) && (
                      <svg
                        className='w-3 h-3 text-primary-foreground'
                        fill='none'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path d='M5 13l4 4L19 7'></path>
                      </svg>
                    )}
                  </div>
                  <span className='text-sm'>{t('Search.All Products')}</span>
                </Link>
                <Link
                  href={getFilterUrl({ discount: discount === 'true' ? 'all' : 'true', params })}
                  className='flex items-center gap-2 hover:text-primary transition-colors'
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      discount === 'true'
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {discount === 'true' && (
                      <svg
                        className='w-3 h-3 text-primary-foreground'
                        fill='none'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path d='M5 13l4 4L19 7'></path>
                      </svg>
                    )}
                  </div>
                  <span className='text-sm'>🔥 {t('Home.Hot Deals')}</span>
                </Link>
              </div>
            </div>

            {/* Second-Hand Filter */}
            <div>
              <div className='font-semibold mb-3'>{t('Search.Condition')}</div>
              <div className='space-y-2'>
                <Link
                  href={getFilterUrl({ secondHand: 'all', params })}
                  className='flex items-center gap-2 hover:text-primary transition-colors'
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      'all' === secondHand || '' === secondHand
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {('all' === secondHand || '' === secondHand) && (
                      <svg
                        className='w-3 h-3 text-primary-foreground'
                        fill='none'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path d='M5 13l4 4L19 7'></path>
                      </svg>
                    )}
                  </div>
                  <span className='text-sm'>{t('Search.All Products')}</span>
                </Link>
                <Link
                  href={getFilterUrl({ secondHand: secondHand === 'false' ? 'all' : 'false', params })}
                  className='flex items-center gap-2 hover:text-primary transition-colors'
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      secondHand === 'false'
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {secondHand === 'false' && (
                      <svg
                        className='w-3 h-3 text-primary-foreground'
                        fill='none'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path d='M5 13l4 4L19 7'></path>
                      </svg>
                    )}
                  </div>
                  <span className='text-sm'>{t('Search.New Products')}</span>
                </Link>
                <Link
                  href={getFilterUrl({ secondHand: secondHand === 'true' ? 'all' : 'true', params })}
                  className='flex items-center gap-2 hover:text-primary transition-colors'
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      secondHand === 'true'
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {secondHand === 'true' && (
                      <svg
                        className='w-3 h-3 text-primary-foreground'
                        fill='none'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path d='M5 13l4 4L19 7'></path>
                      </svg>
                    )}
                  </div>
                  <span className='text-sm'>{t('Search.Second Hand')}</span>
                </Link>
              </div>
            </div>

            <div>
              <div className='font-semibold mb-3'>{t('Search.Category')}</div>
              <div className='space-y-2'>
                <Link
                  href={getFilterUrl({ category: 'all', params })}
                  className='flex items-center gap-2 hover:text-primary transition-colors'
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      'all' === category || '' === category
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {('all' === category || '' === category) && (
                      <svg
                        className='w-3 h-3 text-primary-foreground'
                        fill='none'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path d='M5 13l4 4L19 7'></path>
                      </svg>
                    )}
                  </div>
                  <span className='text-sm'>{t('Search.All')}</span>
                </Link>
                {categories.map((c: string) => (
                  <Link
                    key={c}
                    href={getFilterUrl({ category: c === category ? 'all' : c, params })}
                    className='flex items-center gap-2 hover:text-primary transition-colors'
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        c === category
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {c === category && (
                        <svg
                          className='w-3 h-3 text-primary-foreground'
                          fill='none'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path d='M5 13l4 4L19 7'></path>
                        </svg>
                      )}
                    </div>
                    <span className='text-sm'>{c}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <PriceRangeSlider params={params} min={0} max={2000} />
            </div>
            </div>
          </MobileFilterDrawer>
        </div>

        {/* Desktop Filter Sidebar */}
        <div className='hidden md:block space-y-6'>
          <div className='flex items-center justify-between pb-2 border-b'>
            <h3 className='font-bold text-sm uppercase tracking-wide'>
              {t('Search.Filters')}
            </h3>
            {(category !== 'all' ||
              price !== 'all' ||
              secondHand !== 'all' ||
              discount !== 'all') && (
              <Button variant='link' size='sm' asChild className='h-auto p-0'>
                <Link href='/search'>{t('Search.Clear All')}</Link>
              </Button>
            )}
          </div>

          {/* Discount Filter */}
          <div>
            <div className='font-semibold mb-3'>{t('Search.Special Offers')}</div>
            <div className='space-y-2'>
              <Link
                href={getFilterUrl({ discount: 'all', params })}
                className='flex items-center gap-2 hover:text-primary transition-colors'
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    'all' === discount || '' === discount
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground'
                  }`}
                >
                  {('all' === discount || '' === discount) && (
                    <svg
                      className='w-3 h-3 text-primary-foreground'
                      fill='none'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path d='M5 13l4 4L19 7'></path>
                    </svg>
                  )}
                </div>
                <span className='text-sm'>{t('Search.All Products')}</span>
              </Link>
              <Link
                href={getFilterUrl({ discount: discount === 'true' ? 'all' : 'true', params })}
                className='flex items-center gap-2 hover:text-primary transition-colors'
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    discount === 'true'
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground'
                  }`}
                >
                  {discount === 'true' && (
                    <svg
                      className='w-3 h-3 text-primary-foreground'
                      fill='none'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path d='M5 13l4 4L19 7'></path>
                    </svg>
                  )}
                </div>
                <span className='text-sm'>🔥 {t('Home.Hot Deals')}</span>
              </Link>
            </div>
          </div>

          {/* Second-Hand Filter */}
          <div>
            <div className='font-semibold mb-3'>{t('Search.Condition')}</div>
            <div className='space-y-2'>
              <Link
                href={getFilterUrl({ secondHand: 'all', params })}
                className='flex items-center gap-2 hover:text-primary transition-colors'
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    'all' === secondHand || '' === secondHand
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground'
                  }`}
                >
                  {('all' === secondHand || '' === secondHand) && (
                    <svg
                      className='w-3 h-3 text-primary-foreground'
                      fill='none'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path d='M5 13l4 4L19 7'></path>
                    </svg>
                  )}
                </div>
                <span className='text-sm'>{t('Search.All Products')}</span>
              </Link>
              <Link
                href={getFilterUrl({ secondHand: secondHand === 'false' ? 'all' : 'false', params })}
                className='flex items-center gap-2 hover:text-primary transition-colors'
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    secondHand === 'false'
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground'
                  }`}
                >
                  {secondHand === 'false' && (
                    <svg
                      className='w-3 h-3 text-primary-foreground'
                      fill='none'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path d='M5 13l4 4L19 7'></path>
                    </svg>
                  )}
                </div>
                <span className='text-sm'>{t('Search.New Products')}</span>
              </Link>
              <Link
                href={getFilterUrl({ secondHand: secondHand === 'true' ? 'all' : 'true', params })}
                className='flex items-center gap-2 hover:text-primary transition-colors'
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    secondHand === 'true'
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground'
                  }`}
                >
                  {secondHand === 'true' && (
                    <svg
                      className='w-3 h-3 text-primary-foreground'
                      fill='none'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path d='M5 13l4 4L19 7'></path>
                    </svg>
                  )}
                </div>
                <span className='text-sm'>{t('Search.Second Hand')}</span>
              </Link>
            </div>
          </div>

          <div>
            <div className='font-semibold mb-3'>{t('Search.Category')}</div>
            <div className='space-y-2'>
              <Link
                href={getFilterUrl({ category: 'all', params })}
                className='flex items-center gap-2 hover:text-primary transition-colors'
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    'all' === category || '' === category
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground'
                  }`}
                >
                  {('all' === category || '' === category) && (
                    <svg
                      className='w-3 h-3 text-primary-foreground'
                      fill='none'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path d='M5 13l4 4L19 7'></path>
                    </svg>
                  )}
                </div>
                <span className='text-sm'>{t('Search.All')}</span>
              </Link>
              {categories.map((c: string) => (
                <Link
                  key={c}
                  href={getFilterUrl({ category: c === category ? 'all' : c, params })}
                  className='flex items-center gap-2 hover:text-primary transition-colors'
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      c === category
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {c === category && (
                      <svg
                        className='w-3 h-3 text-primary-foreground'
                        fill='none'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path d='M5 13l4 4L19 7'></path>
                      </svg>
                    )}
                  </div>
                  <span className='text-sm'>{c}</span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <PriceRangeSlider params={params} min={0} max={2000} />
          </div>
        </div>

        <div className='md:col-span-4 space-y-4'>
          {/* Result Summary Badges */}
          {hasActiveFilters && (
            <div className='flex flex-wrap gap-2'>
              {discount === 'true' && (
                <Badge variant='outline' className='text-orange-600 border-orange-300'>
                  🔥 {t('Search.Showing discounted products')}
                </Badge>
              )}
              {secondHand === 'true' && (
                <Badge variant='outline' className='text-blue-600 border-blue-300'>
                  ♻️ {t('Search.Showing second-hand products')}
                </Badge>
              )}
              {secondHand === 'false' && (
                <Badge variant='outline' className='text-green-600 border-green-300'>
                  ✨ {t('Search.Showing new products only')}
                </Badge>
              )}
            </div>
          )}

          {/* Category-specific promotions */}
          {category !== 'all' && category !== '' && (
            <PromotionBanner limit={1} showDismiss={false} />
          )}

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'>
            {data.products.length === 0 && (
              <div className='col-span-full'>
                {tag === 'todays-deal' ? (
                  <div className='flex flex-col items-center justify-center py-16 px-4'>
                    <div className='text-6xl mb-4'>⚡</div>
                    <h3 className='text-2xl font-bold mb-2'>{t('Search.No Flash Deals Right Now')}</h3>
                    <p className='text-muted-foreground text-center max-w-md'>
                      {t('Search.Check back soon for deals')}
                    </p>
                  </div>
                ) : discount === 'true' ? (
                  <div className='flex flex-col items-center justify-center py-16 px-4'>
                    <div className='text-6xl mb-4'>🔥</div>
                    <h3 className='text-2xl font-bold mb-2'>{t('Search.No Hot Deals Available')}</h3>
                    <p className='text-muted-foreground text-center max-w-md mb-4'>
                      {t('Search.No discounted products')}
                    </p>
                    <Button asChild>
                      <Link href='/search'>{t('Search.Browse All Products')}</Link>
                    </Button>
                  </div>
                ) : (
                  <div className='flex flex-col items-center justify-center py-16 px-4'>
                    <div className='text-6xl mb-4'>🔍</div>
                    <h3 className='text-2xl font-bold mb-2'>{t('Search.No Products Found')}</h3>
                    <p className='text-muted-foreground text-center max-w-md mb-4'>
                      {t('Search.Try adjusting filters')}
                    </p>
                    <Button asChild>
                      <Link href='/search'>{t('Search.Clear All Filters')}</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
            {data.products.map((product: IProduct) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          {data.totalPages > 1 && (
            <Pagination page={page} totalPages={data.totalPages} />
          )}
        </div>
      </div>
    </div>
  )
}
