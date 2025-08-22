import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import { hasPermission } from '@/lib/rbac-utils'

/**
 * Debug endpoint to check user data consistency between session and database
 * Only works in development mode for security
 */
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Debug endpoint only available in development' }, { status: 403 })
  }

  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'No active session',
        session: null,
        dbUser: null,
        consistent: false
      })
    }

    await connectToDatabase()
    const dbUser = await User.findById(session.user.id)

    if (!dbUser) {
      return NextResponse.json({
        error: 'User not found in database',
        session: session.user,
        dbUser: null,
        consistent: false
      })
    }

    const consistent = {
      name: session.user.name === dbUser.name,
      email: session.user.email === dbUser.email,
      role: session.user.role === dbUser.role,
      id: session.user.id === dbUser._id.toString()
    }

    const allConsistent = Object.values(consistent).every(Boolean)

    // Check admin access permissions
    const adminAccess = {
      hasReportsRead: hasPermission(session.user.role, 'reports.read'),
      hasUsersRead: hasPermission(session.user.role, 'users.read'),
      hasProductsRead: hasPermission(session.user.role, 'products.read'),
      shouldHaveAdminAccess: hasPermission(session.user.role, 'reports.read')
    }

    // Check email normalization
    const emailCheck = {
      sessionEmail: session.user.email,
      dbEmail: dbUser.email,
      isNormalized: dbUser.email === dbUser.email.toLowerCase().trim(),
      normalizedVersion: dbUser.email.toLowerCase().trim()
    }

    return NextResponse.json({
      session: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role
      },
      database: {
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt
      },
      consistency: consistent,
      allConsistent,
      adminAccess,
      emailCheck,
      recommendations: [
        ...(!allConsistent ? [
          !consistent.role && 'Role mismatch detected - this could cause authentication issues',
          !consistent.name && 'Name mismatch detected',
          !consistent.email && 'Email mismatch detected - this is critical',
          !consistent.id && 'ID mismatch detected - this is critical'
        ].filter(Boolean) : []),
        !emailCheck.isNormalized && 'Email is not normalized - run email normalization script',
        adminAccess.shouldHaveAdminAccess && 'User should have admin access',
        !adminAccess.shouldHaveAdminAccess && 'User should NOT have admin access'
      ].filter(Boolean)
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check user consistency',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
