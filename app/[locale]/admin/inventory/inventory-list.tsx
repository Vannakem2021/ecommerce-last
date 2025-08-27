'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IInventoryProduct } from '@/types'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { Edit, History, Package, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import StockAdjustmentDialog from './stock-adjustment-dialog'
import StockHistoryDialog from './stock-history-dialog'

function getStockStatus(stock: number) {
  if (stock === 0) {
    return { label: 'Out of Stock', variant: 'destructive' as const, icon: AlertTriangle }
  } else if (stock <= 5) {
    return { label: 'Low Stock', variant: 'secondary' as const, icon: AlertTriangle }
  } else {
    return { label: 'In Stock', variant: 'default' as const, icon: Package }
  }
}

export default function InventoryList({
  products,
  totalProducts,
  page,
  totalPages,
}: {
  products: IInventoryProduct[]
  totalProducts: number
  page: number
  totalPages: number
}) {
  const [selectedProduct, setSelectedProduct] = useState<IInventoryProduct | null>(null)
  const [showStockDialog, setShowStockDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)

  const handleStockAdjustment = (product: IInventoryProduct) => {
    setSelectedProduct(product)
    setShowStockDialog(true)
  }

  const handleViewHistory = (product: IInventoryProduct) => {
    setSelectedProduct(product)
    setShowHistoryDialog(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='w-[150px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.countInStock)
                  const StatusIcon = stockStatus.icon

                  return (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={40}
                              height={40}
                              className='rounded object-cover'
                            />
                          ) : (
                            <div className='w-10 h-10 bg-muted rounded flex items-center justify-center'>
                              <Package className='w-4 h-4 text-muted-foreground' />
                            </div>
                          )}
                          <div>
                            <div className='font-medium'>{product.name}</div>
                            <div className='text-sm text-muted-foreground'>
                              {formatDateTime(product.createdAt).dateOnly}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className='bg-muted px-2 py-1 rounded text-sm'>
                          {product.sku}
                        </code>
                      </TableCell>
                      <TableCell>{typeof product.brand === 'object' ? product.brand.name : product.brand}</TableCell>
                      <TableCell>{typeof product.category === 'object' ? product.category.name : product.category}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>{product.countInStock}</span>
                          <StatusIcon className='w-4 h-4 text-muted-foreground' />
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>
                        <div className='flex flex-col gap-1'>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.label}
                          </Badge>
                          <Badge variant={product.isPublished ? 'default' : 'secondary'}>
                            {product.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex gap-1'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleStockAdjustment(product)}
                            title='Adjust Stock'
                          >
                            <Edit className='w-4 h-4' />
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleViewHistory(product)}
                            title='View Stock History'
                          >
                            <History className='w-4 h-4' />
                          </Button>
                          <Button asChild variant='outline' size='sm' title='Edit Product'>
                            <Link href={`/admin/products/${product._id}`}>
                              <Package className='w-4 h-4' />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          
          {products.length === 0 && (
            <div className='text-center py-8'>
              <Package className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-medium mb-2'>No products found</h3>
              <p className='text-muted-foreground'>
                Try adjusting your search criteria or add some products first.
              </p>
            </div>
          )}

          <div className='flex items-center justify-between mt-4'>
            <div className='text-sm text-muted-foreground'>
              Showing {products.length} of {totalProducts} products
            </div>
            <div className='text-sm text-muted-foreground'>
              Page {page} of {totalPages}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      {selectedProduct && (
        <StockAdjustmentDialog
          product={selectedProduct}
          open={showStockDialog}
          onOpenChange={setShowStockDialog}
        />
      )}

      {/* Stock History Dialog */}
      {selectedProduct && (
        <StockHistoryDialog
          product={selectedProduct}
          open={showHistoryDialog}
          onOpenChange={setShowHistoryDialog}
        />
      )}
    </>
  )
}
