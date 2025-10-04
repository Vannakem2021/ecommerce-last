'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/utils'
import { formatInvoiceCurrency } from '@/lib/utils/invoice-utils'
import QRCode from 'qrcode'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Package } from 'lucide-react'

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

interface PaymentResult {
  id?: string
  status?: string
  email?: string
}

interface AppliedPromotion {
  code?: string
  discountAmount?: number
  originalTotal?: number
  freeShipping?: boolean
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
  isPaid?: boolean
  isDelivered?: boolean
  deliveredAt?: Date
  paidAt?: Date
  paymentResult?: PaymentResult | null
  abaTransactionId?: string | null
  abaPaymentStatus?: string | null
  appliedPromotion?: AppliedPromotion | null
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
    isPaid,
    isDelivered,
    deliveredAt,
    paidAt,
  } = invoiceData

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  // Generate QR code on mount
  useEffect(() => {
    const generateQR = async () => {
      try {
        const trackingUrl = `${window.location.origin}/account/orders/${orderId}`
        const qr = await QRCode.toDataURL(trackingUrl, {
          width: 120,
          margin: 1,
          color: {
            dark: '#0D9488', // Teal color
            light: '#FFFFFF',
          },
        })
        setQrCodeUrl(qr)
      } catch (error) {
        console.error('QR Code generation error:', error)
      }
    }
    generateQR()
  }, [orderId])

  return (
    <div className={`max-w-5xl mx-auto bg-white dark:bg-white shadow-lg border rounded-lg print:shadow-none print:border-none print:rounded-none print:m-0 print:max-w-none ${className}`}>

      <div className="invoice-container p-4 sm:p-8 print:p-4 text-black dark:text-black">
        {/* Professional Company Header */}
        <div className="border-b-2 border-teal-600 pb-4 mb-4 print:break-inside-avoid">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 flex-1">
              <div className="flex-shrink-0">
                <Image
                  src={company.logo}
                  width={80}
                  height={80}
                  alt={`${company.name} logo`}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-teal-700 mb-1">
                  {company.name}
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">{company.slogan}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto">
              <div className="text-left sm:text-right">
                <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">INVOICE</div>
                <div className="text-base sm:text-lg font-semibold text-teal-700 mb-2">{invoiceNumber}</div>
                
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {isPaid && (
                    <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      PAID
                    </Badge>
                  )}
                  {isDelivered && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100">
                      <Package className="w-3 h-3 mr-1" />
                      DELIVERED
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* QR Code */}
              {qrCodeUrl && (
                <div className="flex-shrink-0 text-center">
                  <Image
                    src={qrCodeUrl}
                    alt="Order QR Code"
                    width={100}
                    height={100}
                    className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-teal-600 rounded-lg p-1"
                  />
                  <p className="text-xs text-gray-600 mt-1">Scan to track</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Three-Column Invoice Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 print:gap-4 print:mb-4 print:break-inside-avoid">
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
        <div className="mb-6 print:mb-4">
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
          <div className="w-full sm:w-96">
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 sm:p-6">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-4 border-b border-gray-300 pb-2">
                Invoice Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold text-gray-900">{formatInvoiceCurrency(totals.subtotal)}</span>
                </div>
                
                {/* Discount Display */}
                {invoiceData.appliedPromotion && invoiceData.appliedPromotion.discountAmount && invoiceData.appliedPromotion.discountAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 flex items-center gap-2">
                      <span>Discount</span>
                      {invoiceData.appliedPromotion.code && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                          {invoiceData.appliedPromotion.code}
                        </span>
                      )}:
                    </span>
                    <span className="font-semibold text-red-600">
                      -{formatInvoiceCurrency(invoiceData.appliedPromotion.discountAmount)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 flex items-center gap-2">
                    Shipping & Handling
                    {invoiceData.appliedPromotion?.freeShipping && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                        FREE
                      </span>
                    )}:
                  </span>
                  <span className={`font-semibold ${invoiceData.appliedPromotion?.freeShipping ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {formatInvoiceCurrency(totals.shipping)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Tax (15%):</span>
                  <span className="font-semibold text-gray-900">{formatInvoiceCurrency(totals.tax)}</span>
                </div>
                
                <div className="border-t-2 border-teal-600 pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-base sm:text-lg text-gray-900">Grand Total:</span>
                    <span className="font-bold text-lg sm:text-xl text-teal-700">
                      {formatInvoiceCurrency(totals.total)}
                    </span>
                  </div>
                  {invoiceData.appliedPromotion && invoiceData.appliedPromotion.originalTotal && invoiceData.appliedPromotion.originalTotal > totals.total && (
                    <div className="mt-2 text-right">
                      <span className="text-xs text-gray-500">
                        Original: <span className="line-through">{formatInvoiceCurrency(invoiceData.appliedPromotion.originalTotal)}</span>
                      </span>
                      <span className="ml-2 text-xs font-semibold text-green-600">
                        You saved: {formatInvoiceCurrency(invoiceData.appliedPromotion.originalTotal - totals.total)}!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Receipt Section */}
        {isPaid && (invoiceData.paymentResult || invoiceData.abaTransactionId) && (
          <div className="mb-6 print:mb-4 bg-green-50 border-2 border-green-200 rounded-lg p-4 print:p-3">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-3 flex items-center gap-2">
                  Payment Confirmed
                  <Badge className="bg-green-600 hover:bg-green-600">PAID</Badge>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium mb-1">Payment Method:</p>
                    <p className="text-gray-900">{paymentMethod}</p>
                  </div>
                  {paidAt && (
                    <div>
                      <p className="text-gray-600 font-medium mb-1">Payment Date:</p>
                      <p className="text-gray-900">{formatDateTime(paidAt).dateTime}</p>
                    </div>
                  )}
                  {invoiceData.paymentResult?.id && (
                    <div>
                      <p className="text-gray-600 font-medium mb-1">Transaction ID:</p>
                      <p className="text-gray-900 font-mono text-xs">{invoiceData.paymentResult.id}</p>
                    </div>
                  )}
                  {invoiceData.abaTransactionId && (
                    <div>
                      <p className="text-gray-600 font-medium mb-1">ABA Transaction ID:</p>
                      <p className="text-gray-900 font-mono text-xs">{invoiceData.abaTransactionId}</p>
                    </div>
                  )}
                  {invoiceData.paymentResult?.status && (
                    <div>
                      <p className="text-gray-600 font-medium mb-1">Status:</p>
                      <p className="text-green-700 font-semibold">{invoiceData.paymentResult.status}</p>
                    </div>
                  )}
                  {invoiceData.abaPaymentStatus && (
                    <div>
                      <p className="text-gray-600 font-medium mb-1">Payment Status:</p>
                      <p className="text-green-700 font-semibold capitalize">{invoiceData.abaPaymentStatus}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-xs text-gray-600 italic">
                    This transaction is secure and verified. A payment receipt has been sent to your email.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
