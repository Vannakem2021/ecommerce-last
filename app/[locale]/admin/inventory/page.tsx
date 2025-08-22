import { Metadata } from 'next'
import Link from 'next/link'
import { getAllProductsForInventory } from '@/lib/actions/inventory.actions'
import InventoryList from './inventory-list'
import Pagination from '@/components/shared/pagination'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

  if (!data.success) {
    return (
      <div className='space-y-2'>
        <h1 className='h1-bold'>Inventory Management</h1>
        <Card>
          <CardContent className='p-6'>
            <p className='text-destructive'>Error loading inventory: {data.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex-between'>
        <h1 className='h1-bold'>Inventory Management</h1>
        <div className='text-sm text-muted-foreground'>
          {data.totalProducts} products
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Filter className='w-4 h-4' />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form method='GET' className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {/* Search */}
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                <Input
                  name='query'
                  placeholder='Search by name, SKU, brand...'
                  defaultValue={searchText}
                  className='pl-10'
                />
              </div>

              {/* Brand Filter */}
              <Select name='brand' defaultValue={selectedBrand || 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder='All Brands' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Brands</SelectItem>
                  {data.brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select name='category' defaultValue={selectedCategory || 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder='All Categories' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Categories</SelectItem>
                  {data.categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select name='sort' defaultValue={sort}>
                <SelectTrigger>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='latest'>Latest First</SelectItem>
                  <SelectItem value='oldest'>Oldest First</SelectItem>
                  <SelectItem value='name-asc'>Name A-Z</SelectItem>
                  <SelectItem value='name-desc'>Name Z-A</SelectItem>
                  <SelectItem value='stock-low'>Stock Low-High</SelectItem>
                  <SelectItem value='stock-high'>Stock High-Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='flex gap-2'>
              <Button type='submit' variant='default'>
                <Search className='w-4 h-4 mr-2' />
                Search
              </Button>
              <Button type='button' variant='outline' asChild>
                <Link href='/admin/inventory'>Clear Filters</Link>
              </Button>
            </div>

            {/* Hidden fields to preserve other params */}
            <input type='hidden' name='page' value='1' />
          </form>
        </CardContent>
      </Card>

      {/* Inventory List */}
      <InventoryList
        products={data.products}
        totalProducts={data.totalProducts}
        page={page}
        totalPages={data.totalPages}
      />

      {/* Pagination */}
      {data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} />
      )}
    </div>
  )
}
