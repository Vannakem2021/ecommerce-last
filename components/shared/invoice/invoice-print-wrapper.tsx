'use client'

import { useEffect } from 'react'

interface InvoicePrintWrapperProps {
  children: React.ReactNode
  isPrintMode: boolean
}

export function InvoicePrintWrapper({ children, isPrintMode }: InvoicePrintWrapperProps) {
  useEffect(() => {
    if (isPrintMode) {
      // Add print styles to document head
      const style = document.createElement('style')
      style.textContent = `
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-print-area,
          .invoice-print-area * {
            visibility: visible;
          }
          .invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `
      document.head.appendChild(style)

      // Auto-trigger print dialog
      const timer = setTimeout(() => {
        window.print()
      }, 1000)

      // Cleanup
      return () => {
        clearTimeout(timer)
        document.head.removeChild(style)
      }
    }
  }, [isPrintMode])

  return <>{children}</>
}
