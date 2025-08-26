import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next/metadata'

import { getInvoiceData } from '@/lib/actions/invoice.actions'
import { formatId } from '@/lib/utils'
import InvoiceDocument from '@/components/shared/invoice/invoice-document'
import InvoiceActions from '@/components/shared/invoice/invoice-actions'
import { InvoicePrintWrapper } from '@/components/shared/invoice/invoice-print-wrapper'

interface AdminInvoicePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ print?: string; download?: string }>
}

export async function generateMetadata(props: AdminInvoicePageProps): Promise<Metadata> {
  const params = await props.params
  const { id } = params

  return {
    title: `Admin Invoice - Order ${formatId(id)}`,
    description: 'Admin view of order invoice for download and printing',
  }
}

export default async function AdminInvoicePage(props: AdminInvoicePageProps) {
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
      <div className={`max-w-6xl mx-auto p-4 ${isPrintMode ? 'invoice-print-area' : ''}`}>
        {/* Navigation - hidden in print mode */}
        {!isPrintMode && (
          <div className="no-print mb-6">
            <div className="flex gap-2 text-sm text-gray-600 mb-4">
              <Link href="/admin/orders" className="hover:text-gray-900">
                Orders
              </Link>
              <span>›</span>
              <Link href={`/admin/orders/${id}`} className="hover:text-gray-900">
                Order {formatId(id)}
              </Link>
              <span>›</span>
              <span>Invoice</span>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="h1-bold">
                  Invoice {invoiceData.invoiceNumber}
                </h1>
                <p className="text-gray-600 mt-2">
                  Customer: {invoiceData.customer.name}
                  {invoiceData.customer.email && ` (${invoiceData.customer.email})`}
                </p>
              </div>
              <InvoiceActions
                invoiceNumber={invoiceData.invoiceNumber}
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

        {/* Admin Actions - hidden in print mode */}
        {!isPrintMode && (
          <div className="no-print mt-8 flex justify-between items-center">
            <Link
              href={`/admin/orders/${id}`}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to Order Details
            </Link>
            
            <div className="text-sm text-gray-500">
              <p>Order Status: {invoiceData.isPaid ? 'Paid' : 'Unpaid'}</p>
              {invoiceData.isDelivered && (
                <p>Delivered: {new Date(invoiceData.deliveredAt!).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </InvoicePrintWrapper>
  )
}
