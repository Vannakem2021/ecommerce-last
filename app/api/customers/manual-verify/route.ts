import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import { revalidatePath } from 'next/cache'

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

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Update user email verification status
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        emailVerified: true,
        emailVerifiedAt: new Date()
      },
      { new: true }
    )

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/customers/${userId}/view`)

    return NextResponse.json({
      message: 'Email verified successfully'
    })
  } catch (error) {
    console.error('Manual verify error:', error)
    return NextResponse.json(
      { message: 'Failed to verify email' },
      { status: 500 }
    )
  }
}
