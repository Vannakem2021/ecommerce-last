import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAllCategoriesForAdmin } from '@/lib/actions/category.actions'
import CategoryList from './category-list'
import CategoryOverviewCards from '@/components/shared/category/category-overview-cards'
import CategoryFilters from '@/components/shared/category/category-filters'

export const metadata: Metadata = {
  title: 'Admin Categories',
}

export default async function AdminCategoriesPage(props: {
  searchParams: Promise<{
    page: string
    query: string
    sort: string
    status: string
  }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const searchText = searchParams.query || ''
  const sort = searchParams.sort || 'latest'
  const status = searchParams.status || 'all'

  const data = await getAllCategoriesForAdmin({
    query: searchText,
    page,
    sort,
    status,
  })

  // Calculate category metrics
  const categoryMetrics = {
    totalCategories: data.totalCategories,
    activeCategories: data.categories.filter(cat => cat.active).length,
    inactiveCategories: data.categories.filter(cat => !cat.active).length
  }

  const currentPage = Number(page)
  const startItem = ((currentPage - 1) * 10) + 1
  const endItem = Math.min(currentPage * 10, data.totalCategories)

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Organize and manage product categories
          </p>
        </div>
        <Button asChild className="flex items-center gap-2">
          <Link href="/admin/categories/create">
            <Plus className="h-4 w-4" />
            Create Category
          </Link>
        </Button>
      </div>

      {/* Category Overview Cards */}
      <CategoryOverviewCards metrics={categoryMetrics} />

      {/* Advanced Filtering */}
      <CategoryFilters
        totalResults={data.totalCategories}
        currentRange={data.totalCategories === 0 ? 'No' : `${startItem}-${endItem} of ${data.totalCategories}`}
        initialQuery={searchText}
        initialStatus={status}
        initialSort={sort}
      />

      {/* Enhanced Categories Table */}
      <div className="border rounded-lg">
        <CategoryList
          data={data.categories}
          totalCategories={data.totalCategories}
          page={page}
          totalPages={data.totalPages}
        />

        {/* Enhanced Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {startItem} to {endItem} of {data.totalCategories} categories
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                disabled={currentPage <= 1}
              >
                <Link
                  href={currentPage <= 1 ? '#' : `?page=${currentPage - 1}&query=${searchText}&sort=${sort}&status=${status}`}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {data.totalPages}
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                disabled={currentPage >= data.totalPages}
              >
                <Link
                  href={currentPage >= data.totalPages ? '#' : `?page=${currentPage + 1}&query=${searchText}&sort=${sort}&status=${status}`}
                  className={currentPage >= data.totalPages ? 'pointer-events-none opacity-50' : ''}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
