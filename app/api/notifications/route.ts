import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/actions/notification.actions'

// GET - Fetch notifications for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      console.warn('Notifications API access attempt without authentication')
      return NextResponse.json(
        { error: 'Authentication required' },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
          },
        }
      )
    }

    // Get limit from query params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await getNotifications(limit)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        notifications: result.notifications,
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    )
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationId, action } = body

    let result

    if (action === 'markAllRead') {
      result = await markAllNotificationsAsRead()
    } else if (notificationId) {
      result = await markNotificationAsRead(notificationId)
    } else {
      return NextResponse.json(
        { error: 'Invalid request: notificationId or action required' },
        { status: 400 }
      )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete notification(s)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Invalid request: notificationId required' },
        { status: 400 }
      )
    }

    const result = await deleteNotification(notificationId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
