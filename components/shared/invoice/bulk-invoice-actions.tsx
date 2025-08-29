'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileTextIcon,
  BarChart3Icon,
  FilterIcon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleBulkAction = async (action: string) => {
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: 'Feature Coming Soon',
        description: `${action} functionality will be available in a future update.`,
      })
      setIsLoading(false)
    }, 1000)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileTextIcon className="h-5 w-5" />
          Invoice Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-3 bg-card border rounded-lg">
            <div className="text-2xl font-bold text-foreground">{totalOrders}</div>
            <div className="text-sm text-muted-foreground">Total Orders</div>
          </div>

          <div className="text-center p-3 bg-card border rounded-lg">
            <div className="text-2xl font-bold text-foreground">{paidOrders}</div>
            <div className="text-sm text-muted-foreground">Invoiceable Orders</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Quick Actions</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('Generate Report')}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <BarChart3Icon className="h-4 w-4" />
              Invoice Report
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('Filter Paid Orders')}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <FilterIcon className="h-4 w-4" />
              Show Invoiceable
            </Button>
          </div>
        </div>

        {/* Status Information */}
        <div className="border-t pt-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {paidOrders} orders have invoices available
            </Badge>
            
            {totalOrders - paidOrders > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalOrders - paidOrders} orders pending payment
              </Badge>
            )}
          </div>
          
          {paidOrders === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              No invoices available. Invoices are generated automatically when orders are paid.
            </p>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <p>
            <strong>Tip:</strong> Invoices are automatically available for paid orders. 
            Use the individual invoice buttons in the Actions column for specific orders.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
