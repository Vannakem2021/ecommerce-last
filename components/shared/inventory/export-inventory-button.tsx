'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface ExportInventoryButtonProps {
  filters: {
    query?: string
    brand?: string
    category?: string
    stockStatus?: string
    sort?: string
  }
  totalProducts: number
}

export function ExportInventoryButton({
  filters,
  totalProducts,
}: ExportInventoryButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Call the export API
      const response = await fetch('/api/inventory/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
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
      link.download = `inventory-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Show success message
      toast({
        title: 'Export Successful',
        description: `Exported ${totalProducts} product${totalProducts !== 1 ? 's' : ''} to Excel`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export inventory',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
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
  )
}
