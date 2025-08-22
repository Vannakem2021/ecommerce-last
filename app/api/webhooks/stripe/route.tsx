import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { sendPurchaseReceipt } from '@/emails'
import Order from '@/lib/db/models/order.model'
import { updateOrderToPaid } from '@/lib/actions/order.actions'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(req: NextRequest) {
  const event = await stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get('stripe-signature') as string,
    process.env.STRIPE_WEBHOOK_SECRET as string
  )

  if (event.type === 'charge.succeeded') {
    const charge = event.data.object
    const orderId = charge.metadata.orderId
    const email = charge.billing_details.email
    const pricePaidInCents = charge.amount

    // Update payment result first
    const order = await Order.findById(orderId)
    if (order == null) {
      return new NextResponse('Bad Request', { status: 400 })
    }

    order.paymentResult = {
      id: event.id,
      status: 'COMPLETED',
      email_address: email!,
      pricePaid: (pricePaidInCents / 100).toFixed(2),
    }
    await order.save()

    // Use the existing updateOrderToPaid function which now includes stock movement tracking
    try {
      await updateOrderToPaid(orderId)
    } catch (err) {
      console.log('Order update error', err)
      return new NextResponse('Internal Server Error', { status: 500 })
    }

    return NextResponse.json({
      message: 'updateOrderToPaid was successful',
    })
  }
  return new NextResponse()
}
