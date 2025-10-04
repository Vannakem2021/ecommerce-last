'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PrinterIcon, DownloadIcon, EyeIcon } from 'lucide-react'
import { FaFileInvoice } from 'react-icons/fa'
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

  const handleDownload = () => {
    // Use browser's print-to-PDF functionality
    // This works better because it supports Khmer fonts and images properly
    const printWindow = window.open(
      `/api/invoice/${orderId}/print?download=true`,
      '_blank',
      'width=800,height=600,scrollbars=yes,resizable=yes'
    )

    if (printWindow) {
      toast({
        title: 'Opening Invoice',
        description: 'Use Ctrl+P or Cmd+P to save as PDF with full Khmer support',
      })
    } else {
      toast({
        title: 'Please Allow Popups',
        description: 'Enable popups for this site to download the invoice.',
        variant: 'destructive',
      })
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
    <div className={`flex flex-col sm:flex-row gap-2 w-full sm:w-auto ${className}`}>
      {/* Print Button - Primary Action */}
      <Button
        variant={variant}
        size={size}
        onClick={handlePrint}
        disabled={isLoading}
        className="flex items-center justify-center gap-2 flex-1 sm:flex-initial"
      >
        <PrinterIcon className="h-4 w-4" />
        {showLabels && <span>Print</span>}
      </Button>

      {/* Download Button - Primary Action */}
      <Button
        variant={variant}
        size={size}
        onClick={handleDownload}
        disabled={isLoading}
        className="flex items-center justify-center gap-2 flex-1 sm:flex-initial"
      >
        <DownloadIcon className="h-4 w-4" />
        {showLabels && <span>Download PDF</span>}
      </Button>

      {/* View Invoice Button - Secondary */}
      <Button
        variant="outline"
        size={size}
        onClick={handleView}
        disabled={isLoading}
        className="flex items-center justify-center gap-2 flex-1 sm:flex-initial"
      >
        <EyeIcon className="h-4 w-4" />
        {showLabels && <span>Preview</span>}
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
      className={`flex items-center justify-center ${className}`}
    >
      <FaFileInvoice className="h-3 w-3" />
    </Button>
  )
}
