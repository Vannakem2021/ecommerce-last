'use server'

import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import Order from '@/lib/db/models/order.model'
import User from '@/lib/db/models/user.model'

export interface AccountStats {
  totalOrders: number
  recentOrders: number
  pendingOrders: number
  totalSpent: number
  savedAddresses: number
  hasDefaultAddress: boolean
}

export interface RecentOrder {
  _id: string
  orderNumber?: string
  createdAt: Date
  totalPrice: number
  isPaid: boolean
  isDelivered: boolean
  itemsCount: number
  status: string
}

export async function getAccountStats(): Promise<{
  success: boolean
  data?: AccountStats
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    await connectToDatabase()

    // Get all user orders
    const orders = await Order.find({ user: session.user.id }).lean()

    // Get user data for addresses
    const user = await User.findById(session.user.id).select('addresses').lean()

    // Calculate stats
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const stats: AccountStats = {
      totalOrders: orders.length,
      recentOrders: orders.filter((o: any) => new Date(o.createdAt) > thirtyDaysAgo).length,
      pendingOrders: orders.filter((o: any) => !o.isDelivered).length,
      totalSpent: orders
        .filter((o: any) => o.isPaid)
        .reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0),
      savedAddresses: user?.addresses?.length || 0,
      hasDefaultAddress: user?.addresses?.some((a: any) => a.isDefault) || false,
    }

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    console.error('Error getting account stats:', error)
    return {
      success: false,
      error: 'Failed to get account stats',
    }
  }
}

export async function getRecentOrders(limit: number = 5): Promise<{
  success: boolean
  data?: RecentOrder[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    await connectToDatabase()

    const orders = await Order.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    const recentOrders: RecentOrder[] = orders.map((order: any) => {
      let status = 'Processing'
      if (order.isDelivered) {
        status = 'Delivered'
      } else if (order.isPaid) {
        status = 'Paid'
      } else {
        status = 'Pending Payment'
      }

      return {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        totalPrice: order.totalPrice,
        isPaid: order.isPaid || false,
        isDelivered: order.isDelivered || false,
        itemsCount: order.items?.length || 0,
        status,
      }
    })

    return {
      success: true,
      data: recentOrders,
    }
  } catch (error) {
    console.error('Error getting recent orders:', error)
    return {
      success: false,
      error: 'Failed to get recent orders',
    }
  }
}
