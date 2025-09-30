'use client'
import Link from 'next/link'
import Image from 'next/image'

import DeleteDialog from '@/components/shared/delete-dialog'
import ProductOverviewCards from '@/components/shared/product/product-overview-cards'
import ProductFilters, { ProductFilterState } from '@/components/shared/product/product-filters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  deleteProduct,
  getAllProductsForAdmin,
} from '@/lib/actions/product.actions'
import { IProduct } from '@/lib/db/models/product.model'

import React, { useEffect, useState, useTransition } from 'react'
import { formatDateTime } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Eye, Edit, Plus, Star } from 'lucide-react'
import { generateProductSKU, getStockStatus } from '@/lib/utils/product-utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type ProductListDataProps = {
  products: IProduct[]
  totalPages: number
  totalProducts: number
  to: number
  from: number
  metrics: {
    totalProducts: number
    publishedProducts: number
    draftProducts: number
    lowStockCount: number
    outOfStockCount: number
    totalValue: number
    avgRating: number
  }
}
const ProductList = () => {
  const [page, setPage] = useState<number>(1)
  const [searchValue, setSearchValue] = useState<string>('')
  const [, setFilters] = useState<ProductFilterState>({
    category: 'all',
    stockStatus: 'all',
    priceRange: 'all',
    rating: 'all',
    tags: []
  })
  const [data, setData] = useState<ProductListDataProps>()
  const [isPending, startTransition] = useTransition()
  const debounceRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  const handlePageChange = (changeType: 'next' | 'prev') => {
    const newPage = changeType === 'next' ? page + 1 : page - 1
    setPage(newPage)
    startTransition(async () => {
      const data = await getAllProductsForAdmin({
        query: searchValue,
        page: newPage,
      })
      setData(data)
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      setPage(1) // Reset page when searching
      startTransition(async () => {
        const data = await getAllProductsForAdmin({ query: value, page: 1 })
        setData(data)
      })
    }, 500)
  }

  const handleFilterChange = (newFilters: ProductFilterState) => {
    setFilters(newFilters)
    setPage(1)
    // TODO: Implement actual filtering logic based on filters
    startTransition(async () => {
      const data = await getAllProductsForAdmin({ query: searchValue, page: 1 })
      setData(data)
    })
  }
  useEffect(() => {
    startTransition(async () => {
      const data = await getAllProductsForAdmin({ query: '' })
      setData(data)
    })

    // Cleanup debounce on unmount
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Use global metrics from backend instead of calculating from current page
  const metrics = data?.metrics || {
    totalProducts: 0,
    publishedProducts: 0,
    draftProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0,
    avgRating: 0
  }

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product catalog and inventory
          </p>
        </div>
        <Button asChild className="flex items-center gap-2">
          <Link href="/admin/products/create">
            <Plus className="h-4 w-4" />
            Create Product
          </Link>
        </Button>
      </div>

      {/* Product Overview Cards */}
      <ProductOverviewCards metrics={metrics} />

      {/* Advanced Filtering */}
      <ProductFilters
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        isPending={isPending}
        totalResults={data?.totalProducts || 0}
        currentRange={data?.totalProducts === 0 ? 'No' : `${data?.from}-${data?.to} of ${data?.totalProducts}`}
      />

      {/* Enhanced Products Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-16">IMAGE</TableHead>
              <TableHead>PRODUCT</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">PRICE</TableHead>
              <TableHead>CATEGORY</TableHead>
              <TableHead>STOCK</TableHead>
              <TableHead>RATING</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>UPDATED</TableHead>
              <TableHead className="w-32 text-center">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.products.map((product: IProduct) => {
              const stockInfo = getStockStatus(product.countInStock)
              const productSKU = generateProductSKU(
                product._id,
                product.name,
                typeof product.category === 'object' ? (product.category as unknown as { name: string }).name : product.category
              )

              return (
                <TableRow key={product._id} className="hover:bg-muted/30 transition-colors">
                  {/* Product Image */}
                  <TableCell className="p-2">
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                      <Image
                        src={product.images[0] || '/images/placeholder.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>

                  {/* Product Info */}
                  <TableCell>
                    <div className="space-y-1">
                      <Link
                        href={`/admin/products/${product._id}`}
                        className="font-semibold hover:text-primary transition-colors line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <div className="flex flex-wrap gap-1">
                        {product.tags && product.tags.length > 0 ? (
                          product.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">No tags</span>
                        )}
                        {product.tags && product.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* SKU */}
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      {productSKU}
                    </code>
                  </TableCell>

                  {/* Price */}
                  <TableCell className="text-right font-semibold">
                    ${product.price.toLocaleString()}
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <Badge variant="outline">
                      {typeof product.category === 'object' ? (product.category as unknown as { name: string }).name : product.category}
                    </Badge>
                  </TableCell>

                  {/* Stock with Status */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stockInfo.bgColor}`}></div>
                      <span className="font-medium">{product.countInStock}</span>
                      <span className={`text-xs ${stockInfo.textColor}`}>
                        {stockInfo.status}
                      </span>
                    </div>
                  </TableCell>

                  {/* Rating */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{product.avgRating || 'N/A'}</span>
                    </div>
                  </TableCell>

                  {/* Published Status */}
                  <TableCell>
                    <Badge
                      variant={product.isPublished ? "default" : "secondary"}
                      className={product.isPublished ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {product.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>

                  {/* Last Update */}
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(product.updatedAt).dateOnly}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Link href={`/admin/products/${product._id}`}>
                                <Edit className="h-3 w-3" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit product</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Link target="_blank" href={`/product/${product.slug}`}>
                                <Eye className="h-3 w-3" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View product page</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <DeleteDialog
                                id={product._id}
                                action={deleteProduct}
                                callbackAction={() => {
                                  startTransition(async () => {
                                    const data = await getAllProductsForAdmin({
                                      query: searchValue,
                                    })
                                    setData(data)
                                  })
                                }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Delete product</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {/* Enhanced Pagination */}
        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {data?.from} to {data?.to} of {data?.totalProducts} products
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange('prev')}
                disabled={Number(page) <= 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {page} of {data?.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange('next')}
                disabled={Number(page) >= (data?.totalPages ?? 0)}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductList
