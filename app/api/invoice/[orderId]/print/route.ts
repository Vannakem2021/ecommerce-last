import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getInvoiceData } from '@/lib/actions/invoice.actions'

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

    // Check if this is a download request
    const url = new URL(request.url)
    const isDownload = url.searchParams.get('download') === 'true'

    // Generate HTML content for printing/downloading
    const htmlContent = generatePrintableHTML(invoiceData, isDownload)

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

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  lineNumber?: number;
  size?: string;
  color?: string;
}

interface InvoiceData {
  company: { name: string; address: string; phone: string; email: string; logo?: string; slogan?: string };
  customer: { name: string; address: string; phone: string; email: string };
  items: InvoiceItem[];
  totals: { subtotal: number; tax: number; shipping: number; total: number };
  invoiceNumber: string;
  invoiceDate: string;
  orderId: string;
  paymentMethod: string;
}

function generatePrintableHTML(invoiceData: InvoiceData, isDownload: boolean = false): string {
  const { company, customer, items, totals, invoiceNumber, invoiceDate, orderId, paymentMethod } = invoiceData
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumber}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
        }
        body { font-family: system-ui, -apple-system, sans-serif; }
    </style>
</head>
<body class="bg-white text-black p-8">
    <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center border-b border-gray-300 pb-6 mb-6">
            <div class="flex items-center justify-center mb-4">
                ${company.logo ? `<div class="mr-6">
                    <img src="${company.logo}" alt="${company.name} logo" class="w-24 h-24 object-contain">
                </div>` : ''}
                <div class="text-left">
                    <h1 class="text-3xl font-bold text-teal-700 mb-2">${company.name}</h1>
                    ${company.slogan ? `<p class="text-gray-600 text-lg">${company.slogan}</p>` : ''}
                </div>
            </div>
        </div>

        <!-- Invoice Info -->
        <div class="flex justify-between mb-8 text-sm">
            <div class="space-y-2">
                <p><span class="font-semibold text-teal-700">Invoice No:</span> ${invoiceNumber}</p>
                <p><span class="font-semibold text-teal-700">Invoice Date:</span> ${new Date(invoiceDate).toLocaleDateString()}</p>
                <p><span class="font-semibold text-teal-700">Order ID:</span> ${orderId}</p>
                <p><span class="font-semibold text-teal-700">Payment:</span> ${paymentMethod}</p>
            </div>
            <div class="space-y-2 text-right">
                <p><span class="font-semibold text-teal-700">Customer:</span> ${customer.name}</p>
                ${customer.email ? `<p><span class="font-semibold text-teal-700">Email:</span> ${customer.email}</p>` : ''}
                ${customer.phone ? `<p><span class="font-semibold text-teal-700">Phone:</span> ${customer.phone}</p>` : ''}
            </div>
        </div>

        <!-- Customer Address -->
        ${customer.address ? `
        <div class="mb-8">
            <h3 class="font-semibold text-teal-700 mb-2">Shipping Address:</h3>
            <p class="text-sm text-gray-800">${customer.address}</p>
        </div>
        ` : ''}

        <!-- Items Table -->
        <div class="mb-8">
            <table class="w-full border-collapse border border-gray-400 text-sm">
                <thead>
                    <tr class="bg-teal-600 text-white">
                        <th class="border border-gray-400 px-3 py-3 text-left font-semibold">No</th>
                        <th class="border border-gray-400 px-3 py-3 text-left font-semibold">Product</th>
                        <th class="border border-gray-400 px-3 py-3 text-center font-semibold">Qty</th>
                        <th class="border border-gray-400 px-3 py-3 text-right font-semibold">Unit Price</th>
                        <th class="border border-gray-400 px-3 py-3 text-right font-semibold">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item: InvoiceItem, index: number) => `
                    <tr class="${index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}">
                        <td class="border border-gray-400 px-3 py-3">${item.lineNumber}</td>
                        <td class="border border-gray-400 px-3 py-3">
                            <div class="font-medium">${item.name}</div>
                            ${(item.size || item.color) ? `
                            <div class="text-xs text-gray-600 mt-1">
                                ${item.size ? `Size: ${item.size}` : ''}
                                ${item.size && item.color ? ' • ' : ''}
                                ${item.color ? `Color: ${item.color}` : ''}
                            </div>
                            ` : ''}
                        </td>
                        <td class="border border-gray-400 px-3 py-3 text-center">${item.quantity}</td>
                        <td class="border border-gray-400 px-3 py-3 text-right">$${item.price.toFixed(2)}</td>
                        <td class="border border-gray-400 px-3 py-3 text-right font-medium">$${item.total.toFixed(2)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Totals -->
        <div class="flex justify-end mb-8">
            <div class="w-80 space-y-2 text-sm">
                <div class="flex justify-between">
                    <span>Subtotal:</span>
                    <span class="font-medium">$${totals.subtotal.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                    <span>Shipping:</span>
                    <span class="font-medium">$${totals.shipping.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                    <span>Tax:</span>
                    <span class="font-medium">$${totals.tax.toFixed(2)}</span>
                </div>
                <div class="border-t border-gray-400 pt-2">
                    <div class="flex justify-between">
                        <span class="font-bold text-lg text-teal-700">Grand Total:</span>
                        <span class="font-bold text-lg text-teal-700">$${totals.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Company Footer -->
        <div class="border-t border-gray-400 pt-6 text-center text-sm text-gray-700 space-y-2">
            <p class="font-medium">${company.name}</p>
            <p>${company.address}</p>
            <p>Email: ${company.email} • Phone: ${company.phone}</p>
            <p class="italic mt-4">Thank you for shopping with us!</p>
        </div>

        <!-- Print/Download Controls -->
        <div class="no-print mt-8 text-center space-y-4">
            ${isDownload ? `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 class="text-lg font-semibold text-blue-800 mb-2">📄 Download as PDF</h3>
                <p class="text-blue-700 mb-3">To save this invoice as a PDF file:</p>
                <ol class="text-left text-blue-700 space-y-1 max-w-md mx-auto">
                    <li><strong>1.</strong> Press <kbd class="bg-blue-200 px-2 py-1 rounded">Ctrl+P</kbd> (Windows) or <kbd class="bg-blue-200 px-2 py-1 rounded">Cmd+P</kbd> (Mac)</li>
                    <li><strong>2.</strong> In the print dialog, select <strong>"Save as PDF"</strong></li>
                    <li><strong>3.</strong> Choose your download location and click <strong>"Save"</strong></li>
                </ol>
            </div>
            ` : ''}

            <div class="space-x-4">
                <button onclick="window.print()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
                    ${isDownload ? '📄 Save as PDF' : '🖨️ Print Invoice'}
                </button>
                <button onclick="window.close()" class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold">
                    ✕ Close
                </button>
            </div>
        </div>
    </div>

    <script>
        // Auto-trigger print dialog
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, ${isDownload ? '1000' : '500'});
        };
    </script>
</body>
</html>
  `
}
