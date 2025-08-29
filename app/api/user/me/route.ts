import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserById } from '@/lib/actions/user.actions'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await getUserById(session.user.id)
    
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Failed to fetch user data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}
