import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

import { getInvoiceData } from '@/lib/actions/invoice.actions'
import { formatId } from '@/lib/utils'
import InvoiceDocument from '@/components/shared/invoice/invoice-document'
import InvoiceActions from '@/components/shared/invoice/invoice-actions'
import { InvoicePrintWrapper } from '@/components/shared/invoice/invoice-print-wrapper'

interface InvoicePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ print?: string; download?: string }>
}

export async function generateMetadata(props: InvoicePageProps): Promise<Metadata> {
  const params = await props.params
  const { id } = params

  return {
    title: `Invoice - Order ${formatId(id)}`,
    description: 'Order invoice for download and printing',
  }
}

export default async function InvoicePage(props: InvoicePageProps) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { id } = params
  const { print, download } = searchParams

  // Get invoice data
  const result = await getInvoiceData(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const invoiceData = result.data
  const isPrintMode = print === 'true' || download === 'true'

  return (
    <InvoicePrintWrapper isPrintMode={isPrintMode}>
      <div className={isPrintMode ? 'invoice-print-area' : ''}>
        {/* Navigation - hidden in print mode */}
        {!isPrintMode && (
          <div className="no-print mb-6">
            <div className="flex gap-2 text-sm text-gray-600 mb-4">
              <Link href="/account" className="hover:text-gray-900">
                Your Account
              </Link>
              <span>›</span>
              <Link href="/account/orders" className="hover:text-gray-900">
                Your Orders
              </Link>
              <span>›</span>
              <Link href={`/account/orders/${id}`} className="hover:text-gray-900">
                Order {formatId(id)}
              </Link>
              <span>›</span>
              <span>Invoice</span>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h1 className="h1-bold">
                Invoice {invoiceData.invoiceNumber}
              </h1>
              <InvoiceActions
                orderId={id}
                showLabels={true}
              />
            </div>
          </div>
        )}

        {/* Invoice Document */}
        <InvoiceDocument 
          invoiceData={invoiceData}
          className={isPrintMode ? 'shadow-none border-none' : ''}
        />

        {/* Back to Order Link - hidden in print mode */}
        {!isPrintMode && (
          <div className="no-print mt-8 text-center">
            <Link
              href={`/account/orders/${id}`}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to Order Details
            </Link>
          </div>
        )}
      </div>
    </InvoicePrintWrapper>
  )
}
