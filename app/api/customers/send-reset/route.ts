import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import { requestPasswordReset } from '@/lib/actions/user.actions'

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await auth()
    if (!session?.user?.role || !hasPermission(session.user.role, 'users.update')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Use existing requestPasswordReset action
    const result = await requestPasswordReset({ email })

    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Password reset link sent successfully'
    })
  } catch (error) {
    console.error('Send reset error:', error)
    return NextResponse.json(
      { message: 'Failed to send password reset link' },
      { status: 500 }
    )
  }
}
