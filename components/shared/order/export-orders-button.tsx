'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ExportOrdersButtonProps {
  filters: {
    search?: string
    status?: string
    dateRange?: string
  }
  totalOrders: number
}

export function ExportOrdersButton({
  filters,
  totalOrders,
}: ExportOrdersButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Call API to export orders
      const response = await fetch('/api/orders/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search: filters.search,
          status: filters.status,
          dateRange: filters.dateRange,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Export failed')
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0]
      link.download = `orders-${timestamp}.xlsx`
      
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Export Successful',
        description: `Successfully exported ${totalOrders} orders to Excel`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export orders. Please try again.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleExport}
            disabled={isExporting || totalOrders === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {totalOrders === 0
              ? 'No orders to export'
              : `Export ${totalOrders} order${totalOrders === 1 ? '' : 's'} to Excel`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
