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

interface ExportProductsButtonProps {
  filters: {
    query?: string
    category?: string
    brand?: string
    stockStatus?: string
    publishStatus?: string
  }
  totalProducts: number
}

export function ExportProductsButton({
  filters,
  totalProducts,
}: ExportProductsButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Call API to export products
      const response = await fetch('/api/products/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: filters.query,
          category: filters.category,
          brand: filters.brand,
          stockStatus: filters.stockStatus,
          publishStatus: filters.publishStatus,
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
      link.download = `products-${timestamp}.xlsx`
      
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Export Successful',
        description: `Successfully exported ${totalProducts} product${totalProducts === 1 ? '' : 's'} to Excel`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export products. Please try again.',
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
            disabled={isExporting || totalProducts === 0}
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
            {totalProducts === 0
              ? 'No products to export'
              : `Export ${totalProducts} product${totalProducts === 1 ? '' : 's'} to Excel`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
