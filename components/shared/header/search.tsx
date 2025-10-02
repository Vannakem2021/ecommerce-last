import { getAllCategories } from '@/lib/actions/product.actions'
import { getTranslations } from 'next-intl/server'
import SearchForm from './search-form'

export default async function Search() {
  const categories = await getAllCategories()
  const t = await getTranslations()

  return (
    <SearchForm
      categories={categories}
      allCategoriesText={t('Header.All') + ' Categories'}
    />
  )
}
