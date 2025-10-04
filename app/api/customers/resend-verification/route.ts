import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import { generateEmailOTP } from '@/lib/actions/email-verification.actions'

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

    // Use existing generateEmailOTP action
    const result = await generateEmailOTP(email)

    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Verification email sent successfully'
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { message: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}
