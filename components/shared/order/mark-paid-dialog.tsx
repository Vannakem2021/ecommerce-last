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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Loader2, DollarSign, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { updateOrderToPaid } from '@/lib/actions/order.actions'
import ProductPrice from '@/components/shared/product/product-price'

interface MarkPaidDialogProps {
  orderId: string
  orderNumber: string
  customerName?: string
  totalPrice: number
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showLabel?: boolean
}

export function MarkPaidDialog({
  orderId,
  orderNumber,
  customerName = 'Customer',
  totalPrice,
  variant = 'default',
  size = 'default',
  className = '',
  showLabel = true,
}: MarkPaidDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentReference, setPaymentReference] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const handleConfirm = async () => {
    try {
      setIsLoading(true)

      // Create payment result object with reference if provided
      const paymentResult = paymentReference
        ? {
            id: paymentReference,
            status: 'COMPLETED',
            email_address: '',
            payment_method: 'Manual/Offline',
          }
        : undefined

      const result = await updateOrderToPaid(orderId, paymentResult)

      if (!result.success) {
        throw new Error(result.message)
      }

      toast({
        title: 'Order Marked as Paid',
        description: (
          <div className="space-y-1">
            <p className="font-medium">{orderNumber}</p>
            <p className="text-sm text-muted-foreground">
              Payment confirmation has been sent to customer
            </p>
          </div>
        ),
      })

      setIsOpen(false)
      setPaymentReference('')
      router.refresh()
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        variant: 'destructive',
        title: 'Failed to Mark as Paid',
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
              <CreditCard className="h-4 w-4" />
              {showLabel && <span className="ml-2">Mark as Paid</span>}
            </>
          )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Mark Order as Paid?
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
                    Amount to Confirm:
                  </span>
                  <span className="font-semibold text-foreground text-lg">
                    <ProductPrice price={totalPrice} plain />
                  </span>
                </div>
              </div>

              {/* Payment Reference (Optional) */}
              <div>
                <Label htmlFor="paymentReference">
                  Payment Reference (Optional)
                </Label>
                <Input
                  id="paymentReference"
                  placeholder="e.g., Bank transfer ID, Receipt number"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="mt-1"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter transaction ID, receipt number, or other reference
                </p>
              </div>

              {/* What Will Happen */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  This action will:
                </p>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Mark order as paid</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Update product stock quantities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Record payment timestamp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Send payment receipt to customer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Create stock movement records</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground italic">
                Make sure payment has been received before confirming.
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
                <CreditCard className="h-4 w-4 mr-2" />
                Confirm Payment
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
