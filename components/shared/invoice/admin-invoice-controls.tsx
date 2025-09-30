'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileTextIcon,
  CalendarIcon,
  UserIcon,
  CreditCardIcon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime } from '@/lib/utils'
import { formatInvoiceCurrency } from '@/lib/utils/invoice-utils'
import InvoiceActions from './invoice-actions'

interface AdminInvoiceControlsProps {
  order: {
    _id: string
    isPaid: boolean
    paidAt?: Date
    isDelivered: boolean
    deliveredAt?: Date
    totalPrice: number
    paymentMethod: string
    createdAt: Date
    user?: {
      name: string
      email: string
    }
  }
  invoiceNumber: string
}

export default function AdminInvoiceControls({ order, invoiceNumber }: AdminInvoiceControlsProps) {
  const { toast } = useToast()

  const handleBulkAction = (action: string) => {
    toast({
      title: 'Feature Coming Soon',
      description: `${action} functionality will be available in a future update.`,
    })
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileTextIcon className="h-5 w-5" />
          Admin Invoice Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileTextIcon className="h-4 w-4" />
              Invoice Status
            </div>
            <div>
              {order.isPaid ? (
                <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Invoice Available
                </Badge>
              ) : (
                <Badge variant="destructive">
                  Payment Required
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              Customer
            </div>
            <div className="text-sm">
              <div className="font-medium">{order.user?.name || 'Guest Customer'}</div>
              {order.user?.email && (
                <div className="text-muted-foreground">{order.user.email}</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCardIcon className="h-4 w-4" />
              Payment Info
            </div>
            <div className="text-sm">
              <div className="font-medium">{formatInvoiceCurrency(order.totalPrice)}</div>
              <div className="text-muted-foreground">{order.paymentMethod}</div>
              {order.paidAt && (
                <div className="text-green-600 dark:text-green-400 text-xs">
                  Paid: {formatDateTime(order.paidAt).dateOnly}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Actions */}
        {order.isPaid && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Invoice Actions</h4>
            <div className="flex flex-wrap gap-3">
              <InvoiceActions
                orderId={order._id}
                variant="outline"
                size="sm"
                showLabels={true}
                isAdmin={true}
              />
            </div>
          </div>
        )}

        {/* Admin-Only Features */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Admin Features</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('Email Invoice')}
              disabled={!order.isPaid || !order.user?.email}
            >
              Email to Customer
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('Regenerate Invoice')}
              disabled={!order.isPaid}
            >
              Regenerate
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('Export Data')}
            >
              Export Data
            </Button>
          </div>
          
          {!order.isPaid && (
            <p className="text-sm text-muted-foreground mt-2">
              Invoice actions will be available once the order is paid.
            </p>
          )}

          {order.isPaid && !order.user?.email && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              Email functionality requires customer email address.
            </p>
          )}
        </div>

        {/* Order Timeline */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Order Timeline</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Order Created:</span>
              <span>{formatDateTime(order.createdAt).dateTime}</span>
            </div>

            {order.paidAt && (
              <div className="flex items-center gap-2">
                <CreditCardIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-muted-foreground">Payment Received:</span>
                <span>{formatDateTime(order.paidAt).dateTime}</span>
              </div>
            )}

            {order.deliveredAt && (
              <div className="flex items-center gap-2">
                <FileTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-muted-foreground">Order Delivered:</span>
                <span>{formatDateTime(order.deliveredAt).dateTime}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
