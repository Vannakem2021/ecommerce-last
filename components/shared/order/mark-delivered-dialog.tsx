'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Truck, Loader2, Package, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { deliverOrder } from '@/lib/actions/order.actions'
import ProductPrice from '@/components/shared/product/product-price'

interface MarkDeliveredDialogProps {
  orderId: string
  orderNumber: string
  customerName?: string
  totalPrice: number
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showLabel?: boolean
}

export function MarkDeliveredDialog({
  orderId,
  orderNumber,
  customerName = 'Customer',
  totalPrice,
  variant = 'default',
  size = 'default',
  className = '',
  showLabel = true,
}: MarkDeliveredDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleConfirm = async () => {
    try {
      setIsLoading(true)

      const result = await deliverOrder(orderId)

      if (!result.success) {
        throw new Error(result.message)
      }

      toast({
        title: 'Order Marked as Delivered',
        description: (
          <div className="space-y-1">
            <p className="font-medium">{orderNumber}</p>
            <p className="text-sm text-muted-foreground">
              Customer notification has been sent
            </p>
          </div>
        ),
      })

      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Delivery error:', error)
      toast({
        variant: 'destructive',
        title: 'Failed to Mark as Delivered',
        description:
          error instanceof Error ? error.message : 'Please try again later.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Truck className="h-4 w-4" />
              {showLabel && <span className="ml-2">Mark as Delivered</span>}
            </>
          )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Mark Order as Delivered?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Order Details */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Order Number:
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {orderNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Customer:
                  </span>
                  <span className="text-foreground">{customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Total Amount:
                  </span>
                  <span className="font-semibold text-foreground">
                    <ProductPrice price={totalPrice} plain />
                  </span>
                </div>
              </div>

              {/* What Will Happen */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  This action will:
                </p>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Update order status to &quot;Delivered&quot;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Record delivery timestamp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Send delivery confirmation to customer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Request product review from customer</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground italic">
                Make sure the order has been successfully delivered before
                confirming.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4 mr-2" />
                Confirm Delivery
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
