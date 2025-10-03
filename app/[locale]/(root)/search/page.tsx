import Link from 'next/link'

import Pagination from '@/components/shared/pagination'
import ProductCard from '@/components/shared/product/product-card'
import PromotionBanner from '@/components/shared/promotion/promotion-banner'
import { Button } from '@/components/ui/button'
import {
  getAllCategories,
  getAllProducts,
  getAllTags,
} from '@/lib/actions/product.actions'
import { IProduct } from '@/lib/db/models/product.model'
import ProductSortSelector from '@/components/shared/product/product-sort-selector'
import { getFilterUrl, toSlug } from '@/lib/utils'
import Rating from '@/components/shared/product/rating'

import CollapsibleOnMobile from '@/components/shared/collapsible-on-mobile'
import { getTranslations } from 'next-intl/server'

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
    rating: string
    sort: string
    page: string
    secondHand: string
  }>
}) {
  const searchParams = await props.searchParams
  const t = await getTranslations()
  const {
    q = 'all',
    category = 'all',
    tag = 'all',
    price = 'all',
    rating = 'all',
  } = searchParams

  if (
    (q !== 'all' && q !== '') ||
    category !== 'all' ||
    tag !== 'all' ||
    rating !== 'all' ||
    price !== 'all'
  ) {
    return {
      title: `${t('Search.Search')} ${q !== 'all' ? q : ''}
          ${category !== 'all' ? ` : ${t('Search.Category')} ${category}` : ''}
          ${tag !== 'all' ? ` : ${t('Search.Tag')} ${tag}` : ''}
          ${price !== 'all' ? ` : ${t('Search.Price')} ${price}` : ''}
          ${rating !== 'all' ? ` : ${t('Search.Rating')} ${rating}` : ''}`,
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
    rating: string
    sort: string
    page: string
    secondHand: string
  }>
}) {
  const searchParams = await props.searchParams

  const {
    q = 'all',
    category = 'all',
    tag = 'all',
    price = 'all',
    rating = 'all',
    sort = 'best-selling',
    page = '1',
    secondHand = 'all',
  } = searchParams

  const params = { q, category, tag, price, rating, sort, page, secondHand }

  const categories = await getAllCategories()
  const tags = await getAllTags()
  const data = await getAllProducts({
    category,
    tag,
    query: q,
    price,
    rating,
    page: Number(page),
    sort,
    secondHand,
  })
  const t = await getTranslations()
  return (
    <div>
      <div className='my-2 bg-card md:border-b flex-between flex-col md:flex-row p-4'>
        <div className='flex items-center'>
          {data.totalProducts === 0
            ? t('Search.No')
            : `${data.from}-${data.to} ${t('Search.of')} ${
                data.totalProducts
              }`}{' '}
          {t('Search.results')}
          {(q !== 'all' && q !== '') ||
          (category !== 'all' && category !== '') ||
          (tag !== 'all' && tag !== '') ||
          rating !== 'all' ||
          price !== 'all'
            ? ` ${t('Search.for')} `
            : null}
          {q !== 'all' && q !== '' && '"' + q + '"'}
          {category !== 'all' &&
            category !== '' &&
            `   ${t('Search.Category')}: ` + category}
          {tag !== 'all' && tag !== '' && `   ${t('Search.Tag')}: ` + tag}
          {price !== 'all' && `    ${t('Search.Price')}: ` + price}
          {rating !== 'all' &&
            `    ${t('Search.Rating')}: ` + rating + ` & ${t('Search.up')}`}
          &nbsp;
          {(q !== 'all' && q !== '') ||
          (category !== 'all' && category !== '') ||
          (tag !== 'all' && tag !== '') ||
          rating !== 'all' ||
          price !== 'all' ? (
            <Button variant={'link'} asChild>
              <Link href='/search'>{t('Search.Clear')}</Link>
            </Button>
          ) : null}
        </div>
        <div>
          <ProductSortSelector
            sortOrders={sortOrders}
            sort={sort}
            params={params}
          />
        </div>
      </div>
      <div className='bg-card grid md:grid-cols-5 md:gap-4 p-4'>
        <CollapsibleOnMobile title={t('Search.Filters')}>
          <div className='space-y-6'>
            <div className='flex items-center justify-between pb-2 border-b'>
              <h3 className='font-bold text-sm uppercase tracking-wide'>
                {t('Search.Filters')}
              </h3>
              {(category !== 'all' ||
                price !== 'all' ||
                rating !== 'all' ||
                tag !== 'all' ||
                secondHand !== 'all') && (
                <Button variant='link' size='sm' asChild className='h-auto p-0'>
                  <Link href='/search'>{t('Search.Clear All')}</Link>
                </Button>
              )}
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
                  href={getFilterUrl({ secondHand: 'false', params })}
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
                  href={getFilterUrl({ secondHand: 'true', params })}
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
              <div className='font-semibold mb-3'>{t('Search.Department')}</div>
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
                    href={getFilterUrl({ category: c, params })}
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
              <div className='font-semibold mb-3'>{t('Search.Price')}</div>
              <div className='space-y-2'>
                <Link
                  href={getFilterUrl({ price: 'all', params })}
                  className='flex items-center gap-2 hover:text-primary transition-colors'
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      'all' === price
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {'all' === price && (
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
                {prices.map((p) => (
                  <Link
                    key={p.value}
                    href={getFilterUrl({ price: p.value, params })}
                    className='flex items-center gap-2 hover:text-primary transition-colors'
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        p.value === price
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {p.value === price && (
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
                    <span className='text-sm'>{p.name}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className='font-semibold mb-3'>{t('Search.Rating')}</div>
              <div className='space-y-2'>
                <Link
                  href={getFilterUrl({ rating: 'all', params })}
                  className='flex items-center gap-2 hover:text-primary transition-colors'
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      'all' === rating
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {'all' === rating && (
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
                <Link
                  href={getFilterUrl({ rating: '4', params })}
                  className='flex items-center gap-2 hover:text-primary transition-colors'
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      '4' === rating
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {'4' === rating && (
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
                  <div className='flex items-center gap-1'>
                    <Rating size={12} rating={4} />
                    <span className='text-sm'>{t('Search.& Up')}</span>
                  </div>
                </Link>
              </div>
            </div>
            <div>
              <div className='font-semibold mb-3'>{t('Search.Tag')}</div>
              <div className='space-y-2'>
                <Link
                  href={getFilterUrl({ tag: 'all', params })}
                  className='flex items-center gap-2 hover:text-primary transition-colors'
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      'all' === tag || '' === tag
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {('all' === tag || '' === tag) && (
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
                {tags.map((tagItem: string) => (
                  <Link
                    key={tagItem}
                    href={getFilterUrl({ tag: tagItem, params })}
                    className='flex items-center gap-2 hover:text-primary transition-colors'
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        toSlug(tagItem) === tag
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {toSlug(tagItem) === tag && (
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
                    <span className='text-sm'>{tagItem}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleOnMobile>

        <div className='md:col-span-4 space-y-4'>
          <div>
            <div className='font-bold text-xl'>{t('Search.Results')}</div>
            <div>
              {t('Search.Check each product page for other buying options')}
            </div>
          </div>

          {/* Category-specific promotions */}
          {category !== 'all' && category !== '' && (
            <PromotionBanner limit={1} showDismiss={false} />
          )}

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2  lg:grid-cols-3  '>
            {data.products.length === 0 && (
              <div className='col-span-full'>
                {tag === 'todays-deal' ? (
                  <div className='flex flex-col items-center justify-center py-16 px-4'>
                    <div className='text-6xl mb-4'>⚡</div>
                    <h3 className='text-2xl font-bold mb-2'>No Flash Deals Right Now</h3>
                    <p className='text-muted-foreground text-center max-w-md'>
                      Check back soon for amazing limited-time deals!
                    </p>
                  </div>
                ) : (
                  <div>{t('Search.No product found')}</div>
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
