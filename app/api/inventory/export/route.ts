import { NextRequest, NextResponse } from 'next/server'
import { getInventoryForExport } from '@/lib/actions/inventory.actions'
import { generateInventoryExcel } from '@/lib/utils/excel-export'

/**
 * POST /api/inventory/export
 * Export inventory data to Excel file
 * Accepts filter parameters and returns downloadable .xlsx file
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { query, brand, category, stockStatus, sort } = body

    // Fetch inventory data with filters
    const result = await getInventoryForExport({
      query,
      brand,
      category,
      stockStatus,
      sort,
    })

    // Check if data fetch was successful
    if (!result.success || !result.data) {
      return NextResponse.json(
        { 
          success: false, 
          message: result.message || 'Failed to fetch inventory data' 
        },
        { status: 400 }
      )
    }

    // Check if there's data to export
    if (result.count === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No inventory data to export' 
        },
        { status: 400 }
      )
    }

    // Generate Excel file
    const excelBuffer = await generateInventoryExcel(result.data)

    // Generate filename with current date
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `inventory-${timestamp}.xlsx`

    // Return Excel file as downloadable response
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Inventory export error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Export failed' 
      },
      { status: 500 }
    )
  }
}
