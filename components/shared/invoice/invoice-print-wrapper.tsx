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
          @page {
            size: A4;
            margin: 0.5cm;
          }
          body {
            margin: 0;
            padding: 0;
          }
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
          /* Reduce spacing for one-page fit */
          h1, h2, h3, h4, h5, h6 {
            margin-top: 0.3rem !important;
            margin-bottom: 0.3rem !important;
          }
          p, div {
            margin-top: 0.1rem !important;
            margin-bottom: 0.1rem !important;
          }
          table {
            font-size: 0.85rem !important;
          }
          th, td {
            padding: 0.3rem !important;
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
