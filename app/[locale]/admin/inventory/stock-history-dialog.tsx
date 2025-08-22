'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getStockMovements } from '@/lib/actions/inventory.actions'
import { IInventoryProduct } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  ShoppingCart, 
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface StockMovement {
  _id: string
  type: 'SET' | 'ADJUST' | 'SALE' | 'RETURN' | 'CORRECTION'
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  notes?: string
  createdAt: string
  createdBy: {
    name: string
    email: string
  }
}

interface StockHistoryDialogProps {
  product: IInventoryProduct
  open: boolean
  onOpenChange: (open: boolean) => void
}

const movementTypeConfig = {
  SET: { 
    label: 'Set', 
    icon: Package, 
    variant: 'default' as const,
    description: 'Stock quantity set to absolute value'
  },
  ADJUST: { 
    label: 'Adjust', 
    icon: TrendingUp, 
    variant: 'secondary' as const,
    description: 'Stock quantity adjusted'
  },
  SALE: { 
    label: 'Sale', 
    icon: ShoppingCart, 
    variant: 'destructive' as const,
    description: 'Stock reduced due to sale'
  },
  RETURN: { 
    label: 'Return', 
    icon: RotateCcw, 
    variant: 'default' as const,
    description: 'Stock increased due to return'
  },
  CORRECTION: { 
    label: 'Correction', 
    icon: AlertCircle, 
    variant: 'secondary' as const,
    description: 'Stock corrected'
  },
}

export default function StockHistoryDialog({
  product,
  open,
  onOpenChange,
}: StockHistoryDialogProps) {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalMovements, setTotalMovements] = useState(0)

  const loadMovements = useCallback(async (page: number) => {
    setLoading(true)
    try {
      const result = await getStockMovements(product._id, page)
      if (result.success) {
        setMovements(result.movements as StockMovement[])
        setCurrentPage(result.currentPage)
        setTotalPages(result.totalPages)
        setTotalMovements(result.totalMovements)
      }
    } catch (error) {
      console.error('Failed to load stock movements:', error)
    } finally {
      setLoading(false)
    }
  }, [product._id])

  useEffect(() => {
    if (open && product._id) {
      loadMovements(1)
    }
  }, [open, product._id, loadMovements])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadMovements(page)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[80vh]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <History className='w-5 h-5' />
            Stock Movement History
          </DialogTitle>
          <DialogDescription>
            Stock movement history for {product.name} (SKU: {product.sku})
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className='bg-muted p-3 rounded-lg'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
            <div>
              <span className='text-muted-foreground'>Current Stock:</span>
              <div className='font-medium'>{product.countInStock}</div>
            </div>
            <div>
              <span className='text-muted-foreground'>Total Movements:</span>
              <div className='font-medium'>{totalMovements}</div>
            </div>
            <div>
              <span className='text-muted-foreground'>Product:</span>
              <div className='font-medium truncate'>{product.name}</div>
            </div>
            <div>
              <span className='text-muted-foreground'>SKU:</span>
              <div className='font-medium'>{product.sku}</div>
            </div>
          </div>
        </div>

        {/* Movements Table */}
        <ScrollArea className='flex-1'>
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-muted-foreground'>Loading movements...</div>
            </div>
          ) : movements.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8'>
              <History className='w-12 h-12 text-muted-foreground mb-4' />
              <h3 className='text-lg font-medium mb-2'>No movements found</h3>
              <p className='text-muted-foreground text-center'>
                No stock movements have been recorded for this product yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => {
                  const config = movementTypeConfig[movement.type]
                  const Icon = config.icon
                  const isIncrease = movement.quantity > 0
                  
                  return (
                    <TableRow key={movement._id}>
                      <TableCell className='text-sm'>
                        {formatDateTime(movement.createdAt).dateTime}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className='flex items-center gap-1 w-fit'>
                          <Icon className='w-3 h-3' />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${
                          isIncrease ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isIncrease ? (
                            <TrendingUp className='w-4 h-4' />
                          ) : (
                            <TrendingDown className='w-4 h-4' />
                          )}
                          <span className='font-medium'>
                            {isIncrease ? '+' : ''}{movement.quantity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='font-medium'>
                        {movement.previousStock}
                      </TableCell>
                      <TableCell className='font-medium'>
                        {movement.newStock}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className='font-medium'>{movement.reason}</div>
                          {movement.notes && (
                            <div className='text-sm text-muted-foreground mt-1'>
                              {movement.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='text-sm'>
                        <div>
                          <div className='font-medium'>{movement.createdBy.name}</div>
                          <div className='text-muted-foreground'>
                            {movement.createdBy.email}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>
              Page {currentPage} of {totalPages} ({totalMovements} total movements)
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
              >
                <ChevronLeft className='w-4 h-4' />
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
              >
                Next
                <ChevronRight className='w-4 h-4' />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
