import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserById } from '@/lib/actions/user.actions'

// Rate limiting configuration (for future implementation)
// const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
// const RATE_LIMIT_MAX_REQUESTS = 30 // 30 requests per minute

export async function GET(request: NextRequest) {
  try {
    // Basic request validation
    const userAgent = request.headers.get('user-agent')
    if (!userAgent || userAgent.length < 10) {
      console.warn('Suspicious request: Invalid or missing user agent')
    }

    const session = await auth()

    if (!session?.user?.id) {
      console.warn('API access attempt without authentication')
      return NextResponse.json(
        { error: 'Authentication required' },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
          }
        }
      )
    }

    // Additional session validation
    if (!session.user.role || typeof session.user.role !== 'string') {
      console.error(`Invalid session for user ${session.user.id}: missing or invalid role`)
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const user = await getUserById(session.user.id)

    // Remove sensitive information from response
    const safeUser = {
      ...user,
      password: undefined, // Ensure password is never returned
    }

    return NextResponse.json(
      { user: safeUser },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
  } catch (error) {
    console.error('Failed to fetch user data:', error)

    // Don't reveal internal error details
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        }
      }
    )
  }
}
