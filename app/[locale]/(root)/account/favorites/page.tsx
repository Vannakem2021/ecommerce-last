import Link from 'next/link'

import Pagination from '@/components/shared/pagination'
import FavoritesListClient from '@/components/shared/product/favorites-list-client'
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('Favorites.Your Favorites', { fallback: 'Your Favorites' })}</h1>
        <p className="text-muted-foreground">
          Products you've saved for later
        </p>
      </div>

      <FavoritesListClient products={data as unknown as IProduct[]} />

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} />}
    </div>
  )
}
