'use server'

import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import { Notification } from '@/lib/db/models/notification.model'
import User from '@/lib/db/models/user.model'
import { revalidatePath } from 'next/cache'
import mongoose from 'mongoose'

export type NotificationType = 'order' | 'stock' | 'user' | 'system' | 'payment'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: any
  link?: string
}

// Create a new notification for a specific user
export async function createNotification({
  userId,
  type,
  title,
  message,
  data = {},
  link,
}: CreateNotificationParams) {
  try {
    await connectToDatabase()

    await Notification.create({
      userId,
      type,
      title,
      message,
      data,
      link,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    })

    return { success: true }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false, error: 'Failed to create notification' }
  }
}

// Create notifications for multiple users (e.g., all admins)
export async function createNotificationForRoles({
  roles,
  type,
  title,
  message,
  data = {},
  link,
}: {
  roles: string[]
  type: NotificationType
  title: string
  message: string
  data?: any
  link?: string
}) {
  try {
    await connectToDatabase()

    // Find all users with specified roles (case-insensitive)
    const roleRegexes = roles.map(role => new RegExp(`^${role}$`, 'i'))
    const users = await User.find({ 
      role: { $in: roleRegexes } 
    }).select('_id')

    if (users.length === 0) {
      return { success: true, count: 0 }
    }

    // Create notifications for all users
    const notifications = users.map((user) => ({
      userId: user._id,
      type,
      title,
      message,
      data,
      link,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }))

    await Notification.insertMany(notifications)

    return { success: true, count: users.length }
  } catch (error) {
    console.error('Error creating notifications for roles:', error)
    return { success: false, error: 'Failed to create notifications' }
  }
}

// Get notifications for the current user
export async function getNotifications(limit: number = 50) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    await connectToDatabase()

    // Convert string userId to ObjectId for MongoDB query
    const notifications = await Notification.find({ 
      userId: new mongoose.Types.ObjectId(session.user.id)
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    // Convert MongoDB _id to string and format dates
    const formattedNotifications = notifications.map((notification) => ({
      ...notification,
      id: notification._id.toString(),
      _id: notification._id.toString(),
      userId: notification.userId.toString(),
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
      expiresAt: notification.expiresAt?.toISOString(),
    }))

    return { success: true, notifications: formattedNotifications }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return { success: false, error: 'Failed to fetch notifications' }
  }
}

// Get unread notification count
export async function getUnreadCount() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    await connectToDatabase()

    const count = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(session.user.id),
      read: false,
    })

    return { success: true, count }
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return { success: false, error: 'Failed to fetch unread count' }
  }
}

// Mark a single notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    await connectToDatabase()

    await Notification.updateOne(
      { 
        _id: new mongoose.Types.ObjectId(notificationId), 
        userId: new mongoose.Types.ObjectId(session.user.id)
      },
      { read: true }
    )

    revalidatePath('/admin')

    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error: 'Failed to mark notification as read' }
  }
}

// Mark all notifications as read for current user
export async function markAllNotificationsAsRead() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    await connectToDatabase()

    await Notification.updateMany(
      { 
        userId: new mongoose.Types.ObjectId(session.user.id), 
        read: false 
      },
      { read: true }
    )

    revalidatePath('/admin')

    return { success: true }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return { success: false, error: 'Failed to mark all notifications as read' }
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    await connectToDatabase()

    await Notification.deleteOne({
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(session.user.id),
    })

    revalidatePath('/admin')

    return { success: true }
  } catch (error) {
    console.error('Error deleting notification:', error)
    return { success: false, error: 'Failed to delete notification' }
  }
}

// Delete all read notifications for current user
export async function deleteReadNotifications() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    await connectToDatabase()

    const result = await Notification.deleteMany({
      userId: new mongoose.Types.ObjectId(session.user.id),
      read: true,
    })

    revalidatePath('/admin')

    return { success: true, deletedCount: result.deletedCount }
  } catch (error) {
    console.error('Error deleting read notifications:', error)
    return { success: false, error: 'Failed to delete read notifications' }
  }
}
