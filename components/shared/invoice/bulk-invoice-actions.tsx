'use client'

import { Card, CardContent } from '@/components/ui/card'
import { FileTextIcon } from 'lucide-react'

interface BulkInvoiceActionsProps {
  totalOrders: number
  paidOrders: number
  className?: string
}

export default function BulkInvoiceActions({
  totalOrders,
  paidOrders,
  className = ''
}: BulkInvoiceActionsProps) {

  return (
    <Card className={`${className}`}>
      <CardContent className="pt-6">
        {/* Clean Header with Icon */}
        <div className="flex items-center gap-2 mb-4">
          <FileTextIcon className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-lg">Order Statistics</h3>
        </div>

        {/* Streamlined Statistics Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted/30 rounded-lg border">
            <div className="text-3xl font-bold text-foreground mb-1">{totalOrders}</div>
            <div className="text-sm font-medium text-muted-foreground">Total Orders</div>
          </div>

          <div className="text-center p-4 bg-muted/30 rounded-lg border">
            <div className="text-3xl font-bold text-foreground mb-1">{paidOrders}</div>
            <div className="text-sm font-medium text-muted-foreground">Invoiceable Orders</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
