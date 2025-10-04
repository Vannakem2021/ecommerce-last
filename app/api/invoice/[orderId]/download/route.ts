import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { auth } from '@/auth'
import { getInvoiceData } from '@/lib/actions/invoice.actions'
import InvoicePDFTemplate from '@/components/shared/invoice/invoice-pdf-template'

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
      return NextResponse.json({ error: result.message || 'Invoice not found' }, { status: 404 })
    }

    const invoiceData = result.data

    // Generate PDF using react-pdf (use createElement instead of JSX)
    const pdfBuffer = await renderToBuffer(
      createElement(InvoicePDFTemplate, { invoiceData })
    )

    // Create filename
    const filename = `invoice-${invoiceData.invoiceNumber}.pdf`

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
