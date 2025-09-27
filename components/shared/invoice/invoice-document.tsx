'use client'

import Image from 'next/image'
import { formatDateTime } from '@/lib/utils'
import { formatInvoiceCurrency } from '@/lib/utils/invoice-utils'

interface InvoiceItem {
  lineNumber: number
  name: string
  quantity: number
  price: number
  lineTotal: number
  size?: string
  color?: string
}

interface InvoiceCustomer {
  name: string
  email: string
  phone: string
  address: string
}

interface InvoiceCompany {
  name: string
  logo: string
  email: string
  phone: string
  address: string
  slogan: string
}

interface InvoiceTotals {
  subtotal: number
  shipping: number
  tax: number
  total: number
}

interface InvoiceData {
  invoiceNumber: string
  invoiceDate: Date
  orderId: string
  orderNumber?: string // User-friendly order number
  orderDate: Date
  company: InvoiceCompany
  customer: InvoiceCustomer
  items: InvoiceItem[]
  totals: InvoiceTotals
  paymentMethod: string
}

interface InvoiceDocumentProps {
  invoiceData: InvoiceData
  className?: string
}

export default function InvoiceDocument({ invoiceData, className = '' }: InvoiceDocumentProps) {
  const {
    invoiceNumber,
    invoiceDate,
    orderId,
    orderNumber,
    orderDate,
    company,
    customer,
    items,
    totals,
    paymentMethod,
  } = invoiceData

  return (
    <div className={`max-w-5xl mx-auto bg-white dark:bg-white shadow-lg border rounded-lg print:shadow-none print:border-none print:rounded-none print:m-0 print:max-w-none ${className}`}>

      <div className="invoice-container p-8 text-black dark:text-black">
        {/* Professional Company Header */}
        <div className="border-b-2 border-teal-600 pb-6 mb-8 print:break-inside-avoid">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <Image
                  src={company.logo}
                  width={80}
                  height={80}
                  alt={`${company.name} logo`}
                  className="w-20 h-20 object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-teal-700 mb-1">
                  {company.name}
                </h1>
                <p className="text-gray-600 text-base">{company.slogan}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-800 mb-1">INVOICE</div>
              <div className="text-lg font-semibold text-teal-700">{invoiceNumber}</div>
            </div>
          </div>
        </div>

        {/* Three-Column Invoice Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 print:break-inside-avoid">
          {/* Invoice Details */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-300 pb-1">
              Invoice Details
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Invoice Number:</span>
                <div className="text-gray-900">{invoiceNumber}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Invoice Date:</span>
                <div className="text-gray-900">{formatDateTime(invoiceDate).dateOnly}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Due Date:</span>
                <div className="text-green-700 font-medium">Paid</div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-300 pb-1">
              Bill To
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <div className="font-semibold text-gray-900">{customer.name}</div>
              </div>
              {customer.email && (
                <div>
                  <span className="font-semibold text-gray-700">Email:</span>
                  <div className="text-gray-900">{customer.email}</div>
                </div>
              )}
              {customer.phone && (
                <div>
                  <span className="font-semibold text-gray-700">Phone:</span>
                  <div className="text-gray-900">{customer.phone}</div>
                </div>
              )}
              {customer.address && (
                <div>
                  <span className="font-semibold text-gray-700">Address:</span>
                  <div className="text-gray-900">{customer.address}</div>
                </div>
              )}
            </div>
          </div>

          {/* Order Information */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-300 pb-1">
              Order Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Order Number:</span>
                <div className="text-gray-900">{orderNumber || orderId}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Order Date:</span>
                <div className="text-gray-900">{formatDateTime(orderDate).dateOnly}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Payment Method:</span>
                <div className="text-gray-900">{paymentMethod}</div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Status:</span>
                <div className="text-green-700 font-medium">✅ Delivered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Items Table */}
        <div className="mb-8">
          <div className="bg-gray-50 border-t-2 border-teal-600 rounded-t-lg p-4 mb-0">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
              Items Purchased
            </h3>
          </div>
          <table className="w-full border-collapse border border-gray-300 text-sm rounded-b-lg overflow-hidden">
            <thead>
              <tr className="bg-teal-700 text-white">
                <th className="border border-teal-600 px-4 py-4 text-left font-semibold w-16">#</th>
                <th className="border border-teal-600 px-4 py-4 text-left font-semibold">Product Description</th>
                <th className="border border-teal-600 px-4 py-4 text-center font-semibold w-20">Qty</th>
                <th className="border border-teal-600 px-4 py-4 text-right font-semibold w-32">Unit Price</th>
                <th className="border border-teal-600 px-4 py-4 text-right font-semibold w-32">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className={`border-b border-gray-200 ${index % 2 === 1 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}>
                  <td className="border-r border-gray-200 px-4 py-4 text-center text-gray-700 font-medium">
                    {item.lineNumber}
                  </td>
                  <td className="border-r border-gray-200 px-4 py-4 text-black">
                    <div>
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      {(item.size || item.color) && (
                        <div className="text-xs text-gray-600 mt-1">
                          {item.size && `Size: ${item.size}`}
                          {item.size && item.color && ' • '}
                          {item.color && `Color: ${item.color}`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border-r border-gray-200 px-4 py-4 text-center">
                    <div className="inline-block bg-teal-100 text-teal-800 px-2 py-1 rounded-full text-xs font-semibold">
                      {item.quantity}
                    </div>
                  </td>
                  <td className="border-r border-gray-200 px-4 py-4 text-right text-gray-900 font-medium">
                    {formatInvoiceCurrency(item.price)}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-gray-900">
                    {formatInvoiceCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Professional Summary Section */}
        <div className="flex justify-end mb-8">
          <div className="w-96">
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-4 border-b border-gray-300 pb-2">
                Invoice Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold text-gray-900">{formatInvoiceCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Shipping & Handling:</span>
                  <span className="font-semibold text-gray-900">{formatInvoiceCurrency(totals.shipping)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Tax (15%):</span>
                  <span className="font-semibold text-gray-900">{formatInvoiceCurrency(totals.tax)}</span>
                </div>
                <div className="border-t-2 border-teal-600 pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-gray-900">Grand Total:</span>
                    <span className="font-bold text-xl text-teal-700">
                      {formatInvoiceCurrency(totals.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Company Footer */}
        <div className="border-t-2 border-teal-600 pt-8 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-3">
                Company Information
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">{company.name}</p>
                <p>{company.address}</p>
                <p>Email: <span className="text-teal-700">{company.email}</span></p>
                <p>Phone: <span className="text-teal-700">{company.phone}</span></p>
              </div>
            </div>
            <div className="text-right">
              <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-3">
                Thank You
              </h4>
              <p className="text-sm text-gray-700 italic">
                Thank you for choosing {company.name}!<br />
                We appreciate your business and look forward to serving you again.
              </p>
              <div className="mt-4 text-xs text-gray-500">
                This invoice was generated on {formatDateTime(new Date()).dateTime}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
