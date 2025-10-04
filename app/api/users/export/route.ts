import { NextRequest, NextResponse } from 'next/server'
import { getUsersForExport } from '@/lib/actions/user.actions'
import { generateUsersExcel } from '@/lib/utils/excel-export'

/**
 * GET /api/users/export?type=customer or ?type=system
 * Export users to Excel based on type
 */
export async function GET(request: NextRequest) {
  try {
    // Get user type from query params
    const searchParams = request.nextUrl.searchParams
    const userType = searchParams.get('type') as 'customer' | 'system'

    if (!userType || !['customer', 'system'].includes(userType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user type. Must be "customer" or "system"' },
        { status: 400 }
      )
    }

    // Fetch users data
    const result = await getUsersForExport(userType)

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to fetch users data' },
        { status: 400 }
      )
    }

    // Check if there's data to export
    if (result.data.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No users data to export' },
        { status: 400 }
      )
    }

    // Generate Excel file
    const excelBuffer = await generateUsersExcel(result.data, userType)

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${userType === 'customer' ? 'customers' : 'system-users'}-${timestamp}.xlsx`

    // Return Excel file with proper headers
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
