import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

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
        {/* Enhanced Navigation - hidden in print mode */}
        {!isPrintMode && (
          <div className="no-print mb-6">
            {/* Professional Breadcrumb */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/admin/orders" className="hover:text-foreground transition-colors">
                  Orders
                </Link>
                <span>›</span>
                <Link href={`/admin/orders/${id}`} className="hover:text-foreground transition-colors">
                  {invoiceData.orderNumber}
                </Link>
                <span>›</span>
                <span className="text-foreground font-medium">Invoice</span>
              </div>
            </div>

            {/* Professional Header Section */}
            <div className="bg-card border rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-foreground">
                      Invoice {invoiceData.invoiceNumber}
                    </h1>
                    {invoiceData.isPaid && (
                      <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                        ✅ PAID
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium">Customer:</span> {invoiceData.customer.name}
                      {invoiceData.customer.email && ` (${invoiceData.customer.email})`}
                    </p>
                    <p>
                      <span className="font-medium">Total:</span> {invoiceData.totals?.total ? `$${invoiceData.totals.total.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <InvoiceActions
                    orderId={id}
                    showLabels={true}
                    variant="outline"
                    size="default"
                    isAdmin={true}
                  />
                </div>
              </div>
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
