import { getAllCategories } from '@/lib/actions/product.actions'
import { getTranslations } from 'next-intl/server'
import StorefrontSearch from './storefront-search'

export default async function StorefrontSearchWrapper() {
  const categories = await getAllCategories()
  const t = await getTranslations()

  return (
    <StorefrontSearch
      categories={categories}
      allCategoriesText={t('Header.All') + ' Categories'}
    />
  )
}
