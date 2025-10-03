import { NextRequest, NextResponse } from 'next/server'
import { getOrdersForExport } from '@/lib/actions/order.actions'
import { generateOrdersExcel } from '@/lib/utils/excel-export'

/**
 * POST /api/orders/export
 * Export orders to Excel based on filters
 */
export async function POST(request: NextRequest) {
  try {
    // Get filters from request body
    const body = await request.json()
    const { search, status, dateRange, startDate, endDate } = body

    // Parse dates if provided
    const parsedStartDate = startDate ? new Date(startDate) : undefined
    const parsedEndDate = endDate ? new Date(endDate) : undefined

    // Fetch orders data using the server action
    const result = await getOrdersForExport({
      search,
      status,
      dateRange,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
    })

    // Handle error response
    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

    // Generate Excel file
    const excelBuffer = await generateOrdersExcel(result.data)

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `orders-${timestamp}.xlsx`

    // Return Excel file with proper headers
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Export failed',
      },
      { status: 500 }
    )
  }
}
