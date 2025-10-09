import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Order from '@/lib/db/models/order.model'

/**
 * Get order payment status
 * Used by payment pages to check if payment was completed
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { id } = params

    // Validate order ID format
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Get payment status fields including payment result for failure detection
    const order = await Order.findById(id).select('isPaid paymentMethod paymentResult').lean()

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      isPaid: order.isPaid || false,
      paymentMethod: order.paymentMethod,
      paymentResult: order.paymentResult || null,
    })
  } catch (error) {
    console.error('Error checking order status:', error)
    return NextResponse.json(
      { error: 'Failed to check order status' },
      { status: 500 }
    )
  }
}
