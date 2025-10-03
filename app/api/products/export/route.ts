import { NextRequest, NextResponse } from 'next/server'
import { getProductsForExport } from '@/lib/actions/product.actions'
import { generateProductsExcel } from '@/lib/utils/excel-export'

/**
 * POST /api/products/export
 * Export products to Excel based on filters
 */
export async function POST(request: NextRequest) {
  try {
    // Get filters from request body
    const body = await request.json()
    const { query, category, brand, stockStatus, publishStatus } = body

    // Fetch products data using the server action
    const result = await getProductsForExport({
      query,
      category,
      brand,
      stockStatus,
      publishStatus,
    })

    // Handle error response
    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to fetch products' },
        { status: 400 }
      )
    }

    // Generate Excel file
    const excelBuffer = await generateProductsExcel(result.data)

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `products-${timestamp}.xlsx`

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
