'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PrinterIcon, DownloadIcon, EyeIcon, NotebookText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface InvoiceActionsProps {
  orderId: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  showLabels?: boolean
  className?: string
  isAdmin?: boolean
}

export default function InvoiceActions({
  orderId,
  variant = 'outline',
  size = 'sm',
  showLabels = true,
  className = '',
  isAdmin = false,
}: InvoiceActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handlePrint = async () => {
    try {
      setIsLoading(true)

      // Use the dedicated print API route
      const printWindow = window.open(
        `/api/invoice/${orderId}/print`,
        '_blank',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      )

      if (printWindow) {
        toast({
          title: 'Print Window Opened',
          description: 'Invoice opened for printing. Print dialog will appear automatically.',
        })
      } else {
        toast({
          title: 'Print Failed',
          description: 'Please allow popups and try again.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Print Error',
        description: 'Failed to open print dialog. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      setIsLoading(true)

      // Use the print API with download parameter
      const downloadWindow = window.open(
        `/api/invoice/${orderId}/print?download=true`,
        '_blank',
        'width=900,height=1000,scrollbars=yes,resizable=yes'
      )

      if (downloadWindow) {
        toast({
          title: 'Download Window Opened',
          description: 'Follow the instructions in the new window to save as PDF.',
        })

        // Focus the new window
        downloadWindow.focus()

      } else {
        toast({
          title: 'Download Failed',
          description: 'Please allow popups and try again.',
          variant: 'destructive',
        })
      }

    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download Error',
        description: 'Failed to open download window. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = () => {
    // Determine the correct route based on admin status
    const invoiceRoute = isAdmin
      ? `/admin/orders/${orderId}/invoice`
      : `/account/orders/${orderId}/invoice`

    // Open invoice in new tab for viewing
    window.open(invoiceRoute, '_blank')
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* View Invoice Button */}
      <Button
        variant={variant}
        size={size}
        onClick={handleView}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <EyeIcon className="h-4 w-4" />
        {showLabels && <span>View</span>}
      </Button>

      {/* Print Button */}
      <Button
        variant={variant}
        size={size}
        onClick={handlePrint}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <PrinterIcon className="h-4 w-4" />
        {showLabels && <span>Print</span>}
      </Button>

      {/* Download Button */}
      <Button
        variant={variant}
        size={size}
        onClick={handleDownload}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <DownloadIcon className="h-4 w-4" />
        {showLabels && <span>Download</span>}
      </Button>
    </div>
  )
}

// Simplified version for inline use (just icons)
export function InvoiceActionsCompact({
  orderId,
  className = '',
}: {
  orderId: string
  className?: string
}) {
  return (
    <InvoiceActions
      orderId={orderId}
      variant="ghost"
      size="sm"
      showLabels={false}
      className={className}
    />
  )
}

// Button for order lists - single action
export function ViewInvoiceButton({
  orderId,
  variant = 'outline',
  size = 'sm',
  className = '',
  isAdmin = false,
}: {
  orderId: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  isAdmin?: boolean
}) {
  const handleView = () => {
    // Determine the correct route based on admin status
    const invoiceRoute = isAdmin
      ? `/admin/orders/${orderId}/invoice`
      : `/account/orders/${orderId}/invoice`

    window.open(invoiceRoute, '_blank')
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleView}
      className={`flex items-center ${className}`}
    >
      <NotebookText className="h-3 w-3" />
    </Button>
  )
}
