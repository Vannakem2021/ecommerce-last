import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAllBrandsForAdmin } from '@/lib/actions/brand.actions'
import BrandList from './brand-list'
import BrandOverviewCards from '@/components/shared/brand/brand-overview-cards'
import BrandFilters from '@/components/shared/brand/brand-filters'

export const metadata: Metadata = {
  title: 'Admin Brands',
}

export default async function AdminBrandsPage(props: {
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

  const data = await getAllBrandsForAdmin({
    query: searchText,
    page,
    sort,
    status,
  })

  // Calculate brand metrics
  const brandMetrics = {
    totalBrands: data.totalBrands,
    activeBrands: data.brands.filter(brand => brand.active).length,
    inactiveBrands: data.brands.filter(brand => !brand.active).length
  }

  const currentPage = Number(page)
  const startItem = ((currentPage - 1) * 10) + 1
  const endItem = Math.min(currentPage * 10, data.totalBrands)

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Brands</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize product brands
          </p>
        </div>
        <Button asChild className="flex items-center gap-2">
          <Link href="/admin/brands/create">
            <Plus className="h-4 w-4" />
            Create Brand
          </Link>
        </Button>
      </div>

      {/* Brand Overview Cards */}
      <BrandOverviewCards metrics={brandMetrics} />

      {/* Advanced Filtering */}
      <BrandFilters
        totalResults={data.totalBrands}
        currentRange={data.totalBrands === 0 ? 'No' : `${startItem}-${endItem} of ${data.totalBrands}`}
        initialQuery={searchText}
        initialStatus={status}
        initialSort={sort}
      />

      {/* Enhanced Brands Table */}
      <div className="border rounded-lg">
        <BrandList
          data={data.brands}
          totalBrands={data.totalBrands}
          page={page}
          totalPages={data.totalPages}
        />

        {/* Enhanced Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {startItem} to {endItem} of {data.totalBrands} brands
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
