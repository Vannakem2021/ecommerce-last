import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getInvoiceData } from '@/lib/actions/invoice.actions'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get invoice data with permission checks
    const result = await getInvoiceData(orderId)

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.message }, { status: 404 })
    }

    const invoiceData = result.data

    // Generate HTML content
    const htmlContent = generateInvoiceHTML(invoiceData)

    // Return HTML response for printing
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Invoice print error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateInvoiceHTML(invoiceData: any): string {
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
    paymentResult,
    abaTransactionId,
    appliedPromotion,
  } = invoiceData

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumber}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
    <style>
        @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
            @page { margin: 0.5cm; }
        }
        body { 
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: white;
            color: black;
        }
        .print-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            color: black;
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="print-container p-8">
        <div class="bg-white shadow-lg border rounded-lg p-8 print:shadow-none print:border-none print:rounded-none">
            
            <!-- Header -->
            <div class="border-b-2 border-teal-600 pb-6 mb-6">
                <div class="flex items-start justify-between gap-6">
                    <div class="flex items-center gap-6 flex-1">
                        ${company.logo ? `
                        <div class="flex-shrink-0">
                            <img src="${company.logo}" alt="${company.name}" class="w-20 h-20 object-contain">
                        </div>
                        ` : ''}
                        <div>
                            <h1 class="text-3xl font-bold text-teal-700 mb-1">${company.name}</h1>
                            <p class="text-gray-600 text-base">${company.slogan || ''}</p>
                        </div>
                    </div>
                    <div class="flex gap-4 items-start">
                        <div class="text-right">
                            <div class="text-3xl font-bold text-gray-800 mb-1">INVOICE</div>
                            <div class="text-lg font-semibold text-teal-700 mb-2">${invoiceNumber}</div>
                            
                            <!-- Status Badges -->
                            <div class="flex flex-wrap gap-2 mt-2 justify-end">
                                ${isPaid ? `
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                    ✓ PAID
                                </span>
                                ` : ''}
                                ${isDelivered ? `
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                                    📦 DELIVERED
                                </span>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- QR Code -->
                        <div class="flex-shrink-0 text-center">
                            <canvas id="qrcode"></canvas>
                            <p class="text-xs text-gray-600 mt-1">Scan to track</p>
                        </div>
                    </div>
                </div>

                <!-- Status Timeline -->
                ${isPaid || isDelivered ? `
                <div class="mt-6 pt-4 border-t border-gray-200">
                    <div class="flex items-center justify-between max-w-3xl mx-auto">
                        <!-- Order Placed -->
                        <div class="flex flex-col items-center flex-1">
                            <div class="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center mb-2">
                                <span class="text-white text-sm">💳</span>
                            </div>
                            <p class="text-xs font-semibold text-gray-800">Order Placed</p>
                            <p class="text-xs text-gray-600">${formatDate(orderDate)}</p>
                        </div>

                        <!-- Connection Line -->
                        <div class="flex-1 h-1 ${isPaid ? 'bg-teal-600' : 'bg-gray-300'} mx-2"></div>

                        <!-- Payment -->
                        <div class="flex flex-col items-center flex-1">
                            <div class="w-8 h-8 rounded-full ${isPaid ? 'bg-teal-600' : 'bg-gray-300'} flex items-center justify-center mb-2">
                                <span class="text-white text-sm">✓</span>
                            </div>
                            <p class="text-xs font-semibold ${isPaid ? 'text-gray-800' : 'text-gray-400'}">Payment</p>
                            <p class="text-xs text-gray-600">${isPaid && paidAt ? formatDate(paidAt) : '-'}</p>
                        </div>

                        <!-- Connection Line -->
                        <div class="flex-1 h-1 ${isDelivered ? 'bg-teal-600' : 'bg-gray-300'} mx-2"></div>

                        <!-- Delivered -->
                        <div class="flex flex-col items-center flex-1">
                            <div class="w-8 h-8 rounded-full ${isDelivered ? 'bg-teal-600' : 'bg-gray-300'} flex items-center justify-center mb-2">
                                <span class="text-white text-sm">🚚</span>
                            </div>
                            <p class="text-xs font-semibold ${isDelivered ? 'text-gray-800' : 'text-gray-400'}">Delivered</p>
                            <p class="text-xs text-gray-600">${isDelivered && deliveredAt ? formatDate(deliveredAt) : '-'}</p>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Three-Column Header -->
            <div class="grid grid-cols-3 gap-8 mb-8">
                <!-- Invoice Details -->
                <div class="space-y-3">
                    <h3 class="font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-300 pb-1">
                        Invoice Details
                    </h3>
                    <div class="space-y-2 text-sm">
                        <div>
                            <span class="font-semibold text-gray-700">Invoice Number:</span>
                            <div class="text-gray-900">${invoiceNumber}</div>
                        </div>
                        <div>
                            <span class="font-semibold text-gray-700">Invoice Date:</span>
                            <div class="text-gray-900">${formatDate(invoiceDate)}</div>
                        </div>
                        <div>
                            <span class="font-semibold text-gray-700">Due Date:</span>
                            <div class="text-green-700 font-medium">Paid</div>
                        </div>
                    </div>
                </div>

                <!-- Customer Information -->
                <div class="space-y-3">
                    <h3 class="font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-300 pb-1">
                        Bill To
                    </h3>
                    <div class="space-y-2 text-sm">
                        <div class="font-semibold text-gray-900">${customer.name}</div>
                        ${customer.email ? `
                        <div>
                            <span class="font-semibold text-gray-700">Email:</span>
                            <div class="text-gray-900">${customer.email}</div>
                        </div>
                        ` : ''}
                        ${customer.phone ? `
                        <div>
                            <span class="font-semibold text-gray-700">Phone:</span>
                            <div class="text-gray-900">${customer.phone}</div>
                        </div>
                        ` : ''}
                        ${customer.address ? `
                        <div>
                            <span class="font-semibold text-gray-700">Address:</span>
                            <div class="text-gray-900">${customer.address}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Order Information -->
                <div class="space-y-3">
                    <h3 class="font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-300 pb-1">
                        Order Information
                    </h3>
                    <div class="space-y-2 text-sm">
                        <div>
                            <span class="font-semibold text-gray-700">Order Number:</span>
                            <div class="text-gray-900">${orderNumber || orderId}</div>
                        </div>
                        <div>
                            <span class="font-semibold text-gray-700">Order Date:</span>
                            <div class="text-gray-900">${formatDate(orderDate)}</div>
                        </div>
                        <div>
                            <span class="font-semibold text-gray-700">Payment Method:</span>
                            <div class="text-gray-900">${paymentMethod}</div>
                        </div>
                        <div>
                            <span class="font-semibold text-gray-700">Status:</span>
                            <div class="text-green-700 font-medium">${isDelivered ? '✅ Delivered' : isPaid ? '✅ Paid' : 'Processing'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Items Table -->
            <div class="mb-8">
                <div class="bg-gray-50 border-t-2 border-teal-600 rounded-t-lg p-4 mb-0">
                    <h3 class="font-bold text-gray-800 text-sm uppercase tracking-wide">
                        Items Purchased
                    </h3>
                </div>
                <table class="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                        <tr class="bg-teal-700 text-white">
                            <th class="border border-teal-600 px-4 py-3 text-left font-semibold">#</th>
                            <th class="border border-teal-600 px-4 py-3 text-left font-semibold">Product Description</th>
                            <th class="border border-teal-600 px-4 py-3 text-center font-semibold">Qty</th>
                            <th class="border border-teal-600 px-4 py-3 text-right font-semibold">Unit Price</th>
                            <th class="border border-teal-600 px-4 py-3 text-right font-semibold">Line Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item: any, index: number) => `
                        <tr class="${index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}">
                            <td class="border border-gray-200 px-4 py-3 text-center font-medium text-gray-700">${item.lineNumber}</td>
                            <td class="border border-gray-200 px-4 py-3">
                                <div class="font-semibold text-gray-900">${item.name}</div>
                                ${item.size || item.color ? `
                                <div class="text-xs text-gray-600 mt-1">
                                    ${item.size ? `Size: ${item.size}` : ''}
                                    ${item.size && item.color ? ' • ' : ''}
                                    ${item.color ? `Color: ${item.color}` : ''}
                                </div>
                                ` : ''}
                            </td>
                            <td class="border border-gray-200 px-4 py-3 text-center">
                                <span class="inline-block bg-teal-100 text-teal-800 px-2 py-1 rounded-full text-xs font-semibold">
                                    ${item.quantity}
                                </span>
                            </td>
                            <td class="border border-gray-200 px-4 py-3 text-right font-medium text-gray-900">${formatCurrency(item.price)}</td>
                            <td class="border border-gray-200 px-4 py-3 text-right font-bold text-gray-900">${formatCurrency(item.lineTotal)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Summary and Payment -->
            <div class="grid grid-cols-2 gap-8 mb-8">
                <div></div>
                <div class="bg-gray-50 border border-gray-300 rounded-lg p-6">
                    <h3 class="font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-300 pb-2 mb-4">
                        Invoice Summary
                    </h3>
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-700">Subtotal:</span>
                            <span class="text-gray-900 font-medium">${formatCurrency(totals.subtotal)}</span>
                        </div>
                        ${appliedPromotion?.discountAmount ? `
                        <div class="flex justify-between text-red-700">
                            <span class="flex items-center gap-2">
                                Discount 
                                <span class="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-semibold">
                                    ${appliedPromotion.code}
                                </span>
                            </span>
                            <span class="font-medium">-${formatCurrency(appliedPromotion.discountAmount)}</span>
                        </div>
                        ` : ''}
                        <div class="flex justify-between">
                            <span class="text-gray-700">Shipping:</span>
                            <span class="text-gray-900 font-medium">
                                ${appliedPromotion?.freeShipping ? `
                                <span class="text-green-700 font-semibold">FREE</span>
                                ` : formatCurrency(totals.shipping)}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-700">Tax:</span>
                            <span class="text-gray-900 font-medium">${formatCurrency(totals.tax)}</span>
                        </div>
                        <div class="flex justify-between pt-3 border-t-2 border-teal-600">
                            <span class="text-lg font-bold text-gray-900">Grand Total:</span>
                            <span class="text-lg font-bold text-teal-700">${formatCurrency(totals.total)}</span>
                        </div>
                        ${appliedPromotion?.discountAmount ? `
                        <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                            <p class="text-sm text-gray-700">
                                Original Total: <span class="line-through">${formatCurrency(appliedPromotion.originalTotal || 0)}</span>
                            </p>
                            <p class="text-lg font-bold text-green-700 mt-1">
                                You saved ${formatCurrency(appliedPromotion.discountAmount)}! 🎉
                            </p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- Payment Receipt -->
            ${isPaid && (paymentResult || abaTransactionId) ? `
            <div class="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-8">
                <h3 class="text-lg font-bold text-gray-900 mb-4">✅ Payment Confirmed - PAID</h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="font-semibold text-gray-700">Payment Method:</span>
                        <div class="text-gray-900">${paymentMethod}</div>
                    </div>
                    <div>
                        <span class="font-semibold text-gray-700">Payment Date:</span>
                        <div class="text-gray-900">${paidAt ? formatDate(paidAt) : '-'}</div>
                    </div>
                    ${paymentResult?.id ? `
                    <div>
                        <span class="font-semibold text-gray-700">PayPal Transaction ID:</span>
                        <div class="text-gray-900 font-mono text-xs">${paymentResult.id}</div>
                    </div>
                    ` : ''}
                    ${abaTransactionId ? `
                    <div>
                        <span class="font-semibold text-gray-700">ABA Transaction ID:</span>
                        <div class="text-gray-900 font-mono text-xs">${abaTransactionId}</div>
                    </div>
                    ` : ''}
                </div>
                <p class="text-xs text-gray-600 mt-4 pt-4 border-t border-green-300">
                    ✓ This payment has been securely processed and confirmed.
                </p>
            </div>
            ` : ''}

            <!-- Footer -->
            <div class="grid grid-cols-2 gap-8 pt-6 border-t-2 border-teal-600">
                <div>
                    <h4 class="font-bold text-gray-800 mb-2">Company Information</h4>
                    <div class="text-sm text-gray-700 space-y-1">
                        <p>${company.address}</p>
                        <p>Phone: ${company.phone}</p>
                        <p>Email: ${company.email}</p>
                    </div>
                </div>
                <div class="text-right">
                    <h4 class="font-bold text-gray-800 mb-2">Thank You</h4>
                    <div class="text-sm text-gray-700 space-y-1">
                        <p>Thank you for choosing ${company.name}!</p>
                        <p>We appreciate your business and look forward to serving you again.</p>
                        <p class="text-xs text-gray-500 mt-4">
                            This invoice was generated on ${formatDate(new Date())}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Print Instructions (hidden on print) -->
        <div class="no-print mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p class="text-sm text-gray-700 font-medium mb-2">
                📄 To save as PDF: Press <kbd class="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">Ctrl+P</kbd> 
                (Windows) or <kbd class="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">Cmd+P</kbd> (Mac), 
                then select "Save as PDF"
            </p>
            <button onclick="window.print()" class="mt-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
                🖨️ Print Now
            </button>
        </div>
    </div>

    <script>
        // Generate QR Code
        const trackingUrl = '${`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/orders/${orderId}`}';
        const canvas = document.getElementById('qrcode');
        if (canvas && typeof QRCode !== 'undefined') {
            QRCode.toCanvas(canvas, trackingUrl, {
                width: 100,
                margin: 1,
                color: {
                    dark: '#0D9488',
                    light: '#FFFFFF'
                }
            });
        }

        // Auto-print on load
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>`
}
