import Link from 'next/link'

import Pagination from '@/components/shared/pagination'
import ProductCard from '@/components/shared/product/product-card'
import { getMyFavorites } from '@/lib/actions/favorite.actions'
import { IProduct } from '@/lib/db/models/product.model'
import { getTranslations } from 'next-intl/server'

export const metadata = {
  title: 'Your Favorites',
}

export default async function FavoritesPage(props: {
  searchParams: Promise<{ page?: string }>
}) {
  const t = await getTranslations()
  const searchParams = await props.searchParams
  const page = Number(searchParams.page || '1')
  const { data, totalPages } = await getMyFavorites({ page })

  return (
    <div>
      <div className='flex gap-2'>
        <Link href='/account'>{t('Header.Your account')}</Link>
        <span>></span>
        <span>{t('Favorites.Your Favorites', { fallback: 'Your Favorites' })}</span>
      </div>
      <h1 className='h1-bold pt-4'>{t('Favorites.Your Favorites', { fallback: 'Your Favorites' })}</h1>

      {data.length === 0 ? (
        <div className='py-6 text-muted-foreground'>
          {t('Favorites.No favorites yet', { fallback: 'No favorites yet' })}
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {data.map((product: IProduct) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} />}
    </div>
  )
}

