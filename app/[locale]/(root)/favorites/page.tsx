import Link from 'next/link'

import Pagination from '@/components/shared/pagination'
import FavoritesListClient from '@/components/shared/product/favorites-list-client'
import { getMyFavorites } from '@/lib/actions/favorite.actions'
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
        <span>&gt;</span>
        <span>{t('Favorites.Your Favorites', { fallback: 'Your Favorites' })}</span>
      </div>
      <h1 className='h1-bold pt-4'>{t('Favorites.Your Favorites', { fallback: 'Your Favorites' })}</h1>

      <FavoritesListClient products={data as unknown as IProduct[]} />

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} />}
    </div>
  )
}

