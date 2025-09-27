import { Metadata } from 'next'
import Link from 'next/link'
import { getAllProductsForInventory } from '@/lib/actions/inventory.actions'
import InventoryList from './inventory-list'
import InventoryOverviewCards from '@/components/shared/inventory/inventory-overview-cards'
import InventoryFilters, { InventoryFilterState } from '@/components/shared/inventory/inventory-filters'
import { Button } from '@/components/ui/button'
import { Upload, Download, Plus, ChevronLeft, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin Inventory',
}

export default async function AdminInventoryPage(props: {
  searchParams: Promise<{
    page: string
    query: string
    brand: string
    category: string
    sort: string
  }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const searchText = searchParams.query || ''
  const selectedBrand = searchParams.brand || ''
  const selectedCategory = searchParams.category || ''
  const sort = searchParams.sort || 'latest'

  const data = await getAllProductsForInventory({
    query: searchText,
    brand: selectedBrand,
    category: selectedCategory,
    page,
    sort: sort as 'latest' | 'oldest' | 'name-asc' | 'name-desc' | 'stock-low' | 'stock-high',
  })

  // Calculate inventory metrics
  const inventoryMetrics = {
    totalProducts: data.success ? data.totalProducts : 0,
    lowStockCount: data.success ? data.products.filter(p => p.countInStock > 0 && p.countInStock <= 5).length : 0,
    outOfStockCount: data.success ? data.products.filter(p => p.countInStock === 0).length : 0,
    totalInventoryValue: data.success ? data.products.reduce((sum, product) => sum + (product.price * product.countInStock), 0) : 0,
    averageStockLevel: data.success && data.totalProducts > 0 ? data.products.reduce((sum, product) => sum + product.countInStock, 0) / data.totalProducts : 0,
    inStockCount: data.success ? data.products.filter(p => p.countInStock > 5).length : 0
  }

  const currentPage = Number(page)
  const startItem = ((currentPage - 1) * 20) + 1
  const endItem = Math.min(currentPage * 20, data.success ? data.totalProducts : 0)

  if (!data.success) {
    return (
      <div className="space-y-6">
        {/* Professional Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage product stock levels
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <p className="text-destructive">Error loading inventory: {data.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage product stock levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button asChild className="flex items-center gap-2">
            <Link href="/admin/products/create">
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Inventory Overview Cards */}
      <InventoryOverviewCards metrics={inventoryMetrics} />

      {/* Advanced Filtering */}
      <InventoryFilters
        brands={data.brands}
        categories={data.categories}
        totalResults={data.totalProducts}
        currentRange={data.totalProducts === 0 ? 'No' : `${startItem}-${endItem} of ${data.totalProducts}`}
      />

      {/* Enhanced Inventory Table */}
      <div className="border rounded-lg">
        <InventoryList
          products={data.products}
          totalProducts={data.totalProducts}
          page={page}
          totalPages={data.totalPages}
        />

        {/* Enhanced Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {startItem} to {endItem} of {data.totalProducts} products
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
                  href={currentPage <= 1 ? '#' : `?page=${currentPage - 1}&query=${searchText}&brand=${selectedBrand}&category=${selectedCategory}&sort=${sort}`}
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
                  href={currentPage >= data.totalPages ? '#' : `?page=${currentPage + 1}&query=${searchText}&brand=${selectedBrand}&category=${selectedCategory}&sort=${sort}`}
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
