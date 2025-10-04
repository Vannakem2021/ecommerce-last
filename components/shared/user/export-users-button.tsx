'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ExportUsersButtonProps {
  userType: 'customer' | 'system'
  totalUsers: number
}

export function ExportUsersButton({ userType, totalUsers }: ExportUsersButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Fetch the Excel file
      const response = await fetch(`/api/users/export?type=${userType}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to export users')
      }

      // Get the blob
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0]
      a.download = `${userType === 'customer' ? 'customers' : 'system-users'}_${timestamp}.xlsx`
      
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Export Successful',
        description: `${totalUsers} ${userType === 'customer' ? 'customers' : 'system users'} exported to Excel`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export users',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || totalUsers === 0}
      variant="outline"
      size="sm"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </>
      )}
    </Button>
  )
}
