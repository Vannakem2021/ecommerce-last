import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Order from '@/lib/db/models/order.model'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { id: customerId } = params

    // Check authentication and permissions
    const session = await auth()
    if (!session?.user?.role || !hasPermission(session.user.role, 'users.read')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Fetch all orders for this customer
    const orders = await Order.find({ user: customerId })
      .select('orderNumber totalPrice isPaid isDelivered createdAt')
      .sort({ createdAt: -1 })
      .lean()

    // Calculate statistics
    // Total spent should be sum of ALL orders (not just completed)
    const totalOrders = orders.length
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
    
    // Average order value = total spent / number of orders
    const averageOrder = totalOrders > 0 ? totalSpent / totalOrders : 0
    
    const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null

    // Helper function to get order status
    const getOrderStatus = (order: any) => {
      if (order.isDelivered) return 'Delivered'
      if (order.isPaid) return 'Paid'
      return 'Pending'
    }

    // Get recent orders (last 5)
    const recentOrders = orders.slice(0, 5).map((order) => ({
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      totalPrice: order.totalPrice,
      deliveryStatus: getOrderStatus(order),
      createdAt: order.createdAt.toISOString(),
    }))

    return NextResponse.json({
      stats: {
        totalOrders,
        totalSpent,
        averageOrder,
        lastOrderDate: lastOrderDate ? lastOrderDate.toISOString() : null,
      },
      recentOrders,
    })
  } catch (error) {
    console.error('Customer stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer statistics' },
      { status: 500 }
    )
  }
}
