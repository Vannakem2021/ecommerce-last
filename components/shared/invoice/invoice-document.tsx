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
    orderDate,
    company,
    customer,
    items,
    totals,
    paymentMethod,
  } = invoiceData

  return (
    <div className={`max-w-4xl mx-auto bg-white dark:bg-white shadow-lg border rounded-lg print:shadow-none print:border-none print:rounded-none print:m-0 print:max-w-none ${className}`}>

      <div className="invoice-container p-8 text-black dark:text-black">
        {/* Header */}
        <div className="text-center border-b border-gray-300 pb-6 mb-6 print:break-inside-avoid">
          <div className="flex items-center justify-center mb-4">
            <div className="mr-6">
              <Image
                src={company.logo}
                width={96}
                height={96}
                alt={`${company.name} logo`}
                className="w-24 h-24 object-contain"
              />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-teal-700 mb-2">
                {company.name}
              </h1>
              <p className="text-gray-600 text-lg">{company.slogan}</p>
            </div>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="flex justify-between mb-8 text-sm print:break-inside-avoid">
          <div className="space-y-2">
            <p>
              <span className="font-semibold text-teal-700">Invoice No:</span>{' '}
              {invoiceNumber}
            </p>
            <p>
              <span className="font-semibold text-teal-700">Invoice Date:</span>{' '}
              {formatDateTime(invoiceDate).dateOnly}
            </p>
            <p>
              <span className="font-semibold text-teal-700">Order ID:</span>{' '}
              {orderId}
            </p>
            <p>
              <span className="font-semibold text-teal-700">Order Date:</span>{' '}
              {formatDateTime(orderDate).dateOnly}
            </p>
          </div>
          <div className="space-y-2 text-right">
            <p>
              <span className="font-semibold text-teal-700">Customer:</span>{' '}
              {customer.name}
            </p>
            {customer.email && (
              <p>
                <span className="font-semibold text-teal-700">Email:</span>{' '}
                {customer.email}
              </p>
            )}
            {customer.phone && (
              <p>
                <span className="font-semibold text-teal-700">Phone:</span>{' '}
                {customer.phone}
              </p>
            )}
            <p>
              <span className="font-semibold text-teal-700">Payment:</span>{' '}
              {paymentMethod}
            </p>
          </div>
        </div>

        {/* Customer Address */}
        {customer.address && (
          <div className="mb-8 print:break-inside-avoid">
            <h3 className="font-semibold text-teal-700 mb-2">Shipping Address:</h3>
            <p className="text-sm text-gray-800">{customer.address}</p>
          </div>
        )}

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-400 text-sm">
            <thead>
              <tr className="bg-teal-600 text-white">
                <th className="border border-gray-400 px-3 py-3 text-left font-semibold">No</th>
                <th className="border border-gray-400 px-3 py-3 text-left font-semibold">Product</th>
                <th className="border border-gray-400 px-3 py-3 text-center font-semibold">Qty</th>
                <th className="border border-gray-400 px-3 py-3 text-right font-semibold">Unit Price</th>
                <th className="border border-gray-400 px-3 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className={index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-400 px-3 py-3 text-black">{item.lineNumber}</td>
                  <td className="border border-gray-400 px-3 py-3 text-black">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {(item.size || item.color) && (
                        <div className="text-xs text-gray-600 mt-1">
                          {item.size && `Size: ${item.size}`}
                          {item.size && item.color && ' • '}
                          {item.color && `Color: ${item.color}`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-400 px-3 py-3 text-center text-black">{item.quantity}</td>
                  <td className="border border-gray-400 px-3 py-3 text-right text-black">
                    {formatInvoiceCurrency(item.price)}
                  </td>
                  <td className="border border-gray-400 px-3 py-3 text-right font-medium text-black">
                    {formatInvoiceCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80 space-y-2 text-sm text-black">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{formatInvoiceCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span className="font-medium">{formatInvoiceCurrency(totals.shipping)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span className="font-medium">{formatInvoiceCurrency(totals.tax)}</span>
            </div>
            <div className="border-t border-gray-400 pt-2">
              <div className="flex justify-between">
                <span className="font-bold text-lg text-teal-700">Grand Total:</span>
                <span className="font-bold text-lg text-teal-700">
                  {formatInvoiceCurrency(totals.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Footer */}
        <div className="border-t border-gray-400 pt-6 text-center text-sm text-gray-700 space-y-2">
          <p className="font-medium text-black">{company.name}</p>
          <p className="text-black">{company.address}</p>
          <p className="text-black">
            Email: {company.email} • Phone: {company.phone}
          </p>
          <p className="italic mt-4 text-black">Thank you for shopping with us!</p>
        </div>
      </div>
    </div>
  )
}
