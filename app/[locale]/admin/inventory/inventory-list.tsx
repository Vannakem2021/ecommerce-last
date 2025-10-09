'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IInventoryProduct } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { Edit, History, Package, AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import StockAdjustmentDialog from './stock-adjustment-dialog'
import StockHistoryDialog from './stock-history-dialog'

function getStockStatus(stock: number) {
  if (stock === 0) {
    return {
      label: 'Out of Stock',
      variant: 'destructive' as const,
      icon: AlertTriangle,
      textColor: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950',
      dotColor: 'bg-red-500'
    }
  } else if (stock <= 5) {
    return {
      label: 'Low Stock',
      variant: 'secondary' as const,
      icon: AlertTriangle,
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      dotColor: 'bg-amber-500'
    }
  } else {
    return {
      label: 'In Stock',
      variant: 'default' as const,
      icon: Package,
      textColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      dotColor: 'bg-green-500'
    }
  }
}

export default function InventoryList({
  products,
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
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-16">IMAGE</TableHead>
            <TableHead>PRODUCT</TableHead>
            <TableHead>BRAND</TableHead>
            <TableHead>CATEGORY</TableHead>
            <TableHead>CURRENT STOCK</TableHead>
            <TableHead>UPDATED</TableHead>
            <TableHead className="w-24 text-center">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const stockStatus = getStockStatus(product.countInStock)

            return (
              <TableRow key={product._id} className="hover:bg-muted/30 transition-colors">
                {/* Product Image */}
                <TableCell className="p-2">
                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
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
                    <div className="text-xs text-muted-foreground">
                      SKU: {product.sku}
                    </div>
                  </div>
                </TableCell>

                {/* Brand */}
                <TableCell>
                  <Badge variant="outline">
                    {typeof product.brand === 'object' ? (product.brand as unknown as { name: string }).name : product.brand}
                  </Badge>
                </TableCell>

                {/* Category */}
                <TableCell>
                  <Badge variant="outline">
                    {typeof product.category === 'object' ? (product.category as unknown as { name: string }).name : product.category}
                  </Badge>
                </TableCell>

                {/* Stock Level with Status */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stockStatus.dotColor}`}></div>
                    <span className="font-medium text-lg">{product.countInStock}</span>
                    <span className={`text-xs font-medium ${stockStatus.textColor}`}>
                      {stockStatus.label}
                    </span>
                  </div>
                </TableCell>

                {/* Last Update */}
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(product.updatedAt || product.createdAt).dateOnly}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <TooltipProvider>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleStockAdjustment(product)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Adjust stock</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewHistory(product)}
                          >
                            <History className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View history</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or add some products first.
          </p>
        </div>
      )}

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
