import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getAllCategoriesForAdmin } from '@/lib/actions/category.actions'
import CategoryList from './category-list'
import Pagination from '@/components/shared/pagination'

export const metadata: Metadata = {
  title: 'Admin Categories',
}

export default async function AdminCategoriesPage(props: {
  searchParams: Promise<{
    page: string
    query: string
    sort: string
  }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const searchText = searchParams.query || ''
  const sort = searchParams.sort || 'latest'

  const data = await getAllCategoriesForAdmin({
    query: searchText,
    page,
    sort,
  })

  return (
    <div className='space-y-2'>
      <div className='flex-between'>
        <h1 className='h1-bold'>Categories</h1>
        <Button asChild variant='default'>
          <Link href='/admin/categories/create'>
            <Plus className='w-4 h-4' />
            Create Category
          </Link>
        </Button>
      </div>

      <CategoryList
        data={data.categories}
        totalCategories={data.totalCategories}
        page={page}
        totalPages={data.totalPages}
      />

      {data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} />
      )}
    </div>
  )
}
