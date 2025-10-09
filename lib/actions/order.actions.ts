'use server'

import { Cart, IOrderList, OrderItem, ShippingAddress } from '@/types'
import { formatError, round2, getEffectivePrice, validateVariantPrice, calculateVariantPrice } from '../utils'
import { connectToDatabase } from '../db'
import { auth } from '@/auth'
import { OrderInputSchema } from '../validator'
import Order, { IOrder } from '../db/models/order.model'
import { revalidatePath } from 'next/cache'
import { sendAskReviewOrderItems, sendPurchaseReceipt } from '@/emails'
import { sendOrderPaidNotification, sendOrderDeliveredNotification } from '../telegram'
import { DateRange } from 'react-day-picker'
import Product from '../db/models/product.model'
import User from '../db/models/user.model'
import mongoose from 'mongoose'
import { getSetting } from './setting.actions'
import { createSaleStockMovement } from './inventory.actions'
import { recordPromotionUsage } from './promotion.actions'
import StockMovement from '@/lib/db/models/stock-movement.model'
import { requirePermission } from '../rbac'
import { createNotificationForRoles } from './notification.actions'

// CREATE
export const createOrder = async (clientSideCart: Cart) => {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session) throw new Error('User not authenticated')
    // recalculate price and delivery date on the server
    const createdOrder = await createOrderFromCart(
      clientSideCart,
      session.user.id!
    )

    return {
      success: true,
      message: 'Order placed successfully',
      data: { orderId: createdOrder._id.toString() },
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
export const createOrderFromCart = async (
  clientSideCart: Cart,
  userId: string
) => {
  const cart = {
    ...clientSideCart,
    ...(await calcDeliveryDateAndPrice({
      items: clientSideCart.items,
      shippingAddress: clientSideCart.shippingAddress,
      deliveryDateIndex: clientSideCart.deliveryDateIndex,
    })),
  }

  // Server-enforced per-item pricing: recompute prices based on effective pricing at order time
  await connectToDatabase()
  const currentTime = new Date()

  // Collect unique product IDs from cart items
  const productIds = [...new Set(cart.items.map((item: { product: string }) => item.product))]

  // Query products with pricing/sale fields and variants
  const products = await Product.find(
    { _id: { $in: productIds } },
    { _id: 1, price: 1, listPrice: 1, saleStartDate: 1, saleEndDate: 1, variants: 1 }
  )

  // Build product map for efficient lookup
  const productMap = new Map(products.map(p => [p._id.toString(), p]))

  // Recompute cart items with server-enforced effective prices
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serverTrustedItems = cart.items.map((item: any) => {
    const product = productMap.get(item.product)
    if (!product) {
      // Fallback to client price if product not found (shouldn't happen in normal flow)
      return item
    }

    // Compute base effective price using server-side logic
    let effectivePrice = round2(getEffectivePrice(product, currentTime))
    
    // Add variant pricing if item has variant modifiers
    if (item.variantModifiers && item.variantModifiers.length > 0) {
      // Validate variant pricing to prevent manipulation
      const selectedVariants: { storage?: string; ram?: string } = {}
      
      for (const modifier of item.variantModifiers) {
        if (modifier.type === 'storage') selectedVariants.storage = modifier.value
        if (modifier.type === 'ram') selectedVariants.ram = modifier.value
      }
      
      const validation = validateVariantPrice(product, selectedVariants, item.price)
      
      if (!validation.valid) {
        console.warn(`Price mismatch for item ${item.name}: expected ${item.price}, calculated ${validation.calculatedPrice}`)
        // Use server-calculated price instead of client price
        effectivePrice = validation.calculatedPrice
      } else {
        // Client price is valid, but still use server calculation for consistency
        effectivePrice = validation.calculatedPrice
      }
    }

    return {
      ...item,
      price: effectivePrice,
      // Preserve variant breakdown for order history
      basePrice: item.basePrice || product.price,
      variantModifiers: item.variantModifiers || []
    }
  })

  // Recompute itemsPrice from server-trusted items to ensure consistency
  const serverItemsPrice = round2(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serverTrustedItems.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0)
  )

  // Calculate base total before discount
  const baseTotal = serverItemsPrice + (cart.shippingPrice || 0) + (cart.taxPrice || 0)

  // Apply existing discount amount (promotion discounts are calculated separately and should remain the same)
  const finalTotal = cart.appliedPromotion
    ? round2(baseTotal - (cart.discountAmount || 0))
    : baseTotal

  const order = OrderInputSchema.parse({
    user: userId,
    items: serverTrustedItems,
    shippingAddress: cart.shippingAddress,
    paymentMethod: cart.paymentMethod,
    itemsPrice: serverItemsPrice,
    shippingPrice: cart.shippingPrice,
    taxPrice: cart.taxPrice,
    totalPrice: finalTotal,
    expectedDeliveryDate: cart.expectedDeliveryDate,
    appliedPromotion: cart.appliedPromotion,
    discountAmount: cart.discountAmount || 0,
  })

  // Attempt transactional creation for atomicity
  const session = await mongoose.connection.startSession()
  try {
    session.startTransaction()
    const opts = { session }

    const [createdOrder] = await Order.create([order], opts)

    if (cart.appliedPromotion) {
      const usagePayload = {
        promotion: cart.appliedPromotion.promotionId,
        user: userId,
        order: createdOrder._id.toString(), // Convert ObjectId to string
        discountAmount: cart.appliedPromotion.discountAmount,
        originalTotal: baseTotal,
        finalTotal: finalTotal,
        usedAt: new Date(),
      }
      const res = await recordPromotionUsage(usagePayload, session)
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to record promotion usage')
      }
    }

    await session.commitTransaction()
    
    // Notify admins of new order
    try {
      const user = await User.findById(userId).select('name email')
      await createNotificationForRoles({
        roles: ['admin', 'manager'],
        type: 'order',
        title: 'New Order Received',
        message: `Order from ${user?.name || 'Customer'} - $${finalTotal.toFixed(2)}`,
        data: { orderId: createdOrder._id.toString(), totalPrice: finalTotal },
        link: `/admin/orders/${createdOrder._id}`
      })
    } catch (error) {
      console.error('Failed to create order notification:', error)
    }
    
    return createdOrder
  } catch {
    // Rollback and fallback for non-replica or other tx issues
    try {
      await session.abortTransaction()
    } catch {}

    // Fallback: create without transaction (best-effort)
    const createdOrder = await Order.create(order)
    if (cart.appliedPromotion) {
      try {
        await recordPromotionUsage({
          promotion: cart.appliedPromotion.promotionId,
          user: userId,
          order: createdOrder._id.toString(), // Convert ObjectId to string
          discountAmount: cart.appliedPromotion.discountAmount,
          originalTotal: baseTotal,
          finalTotal: finalTotal,
        } as any)
      } catch (error) {
        console.error('Failed to record promotion usage (non-tx):', error)
        // Preserve prior behavior: do not fail order creation if promotion recording fails
      }
    }

    // Notify admins of new order (fallback path)
    try {
      const user = await User.findById(userId).select('name email')
      await createNotificationForRoles({
        roles: ['admin', 'manager'],
        type: 'order',
        title: 'New Order Received',
        message: `Order from ${user?.name || 'Customer'} - $${finalTotal.toFixed(2)}`,
        data: { orderId: createdOrder._id.toString(), totalPrice: finalTotal },
        link: `/admin/orders/${createdOrder._id}`
      })
    } catch (error) {
      console.error('Failed to create order notification:', error)
    }

    return createdOrder
  } finally {
    try { session.endSession() } catch {}
  }
}

export async function updateOrderToPaid(
  orderId: string,
  paymentResult?: { id?: string; status?: string; email_address?: string; [key: string]: any }
) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectToDatabase()
    }
    const order = await Order.findById(orderId).populate<{
      user: { email: string; name: string }
    }>('user', 'name email')
    if (!order) throw new Error('Order not found')
    if (order.isPaid) return { success: true, message: 'Order already paid' }

    // Always try transactional path first
    let didUpdate = false
    try {
      const { updated } = await updateProductStock(order._id, paymentResult)
      didUpdate = !!updated
    } catch {
      // Fallback: non-transactional update mirroring createOrderFromCart approach
      // 1) Pre-validate all stock levels first
      const stockPlans = [] as Array<{
        productId: string
        sku: string
        previousStock: number
        newStock: number
        quantity: number
      }>
      for (const item of order.items) {
        const product = await Product.findById(item.product)
        if (!product) throw new Error('Product not found')
        const previousStock = product.countInStock
        const newStock = previousStock - item.quantity
        if (newStock < 0) {
          throw new Error(`Insufficient stock for product ${product.sku}`)
        }
        stockPlans.push({
          productId: product._id,
          sku: product.sku,
          previousStock,
          newStock,
          quantity: item.quantity,
        })
      }

      // 2) Apply changes best-effort; revert order flags if any error occurs
      let orderSaved = false
      try {
        order.isPaid = true
        order.paidAt = new Date()
        if (paymentResult) order.paymentResult = paymentResult as any
        await order.save()
        orderSaved = true

        for (const plan of stockPlans) {
          await Product.updateOne(
            { _id: plan.productId },
            { $inc: { countInStock: -plan.quantity, numSales: plan.quantity } }
          )
          await StockMovement.create({
            product: plan.productId,
            sku: plan.sku,
            type: 'SALE',
            quantity: -plan.quantity,
            previousStock: plan.previousStock,
            newStock: plan.newStock,
            reason: `Sale - Order #${order._id}`,
            notes: `Stock reduced due to order payment confirmation`,
            createdBy: order.user as any,
          } as any)
        }
        didUpdate = true
      } catch (fallbackErr) {
        // Revert order flags if we saved them already
        if (orderSaved) {
          try {
            order.isPaid = false
            order.paidAt = undefined as any
            order.paymentResult = undefined as any
            await order.save()
          } catch {}
        }
        throw fallbackErr
      }
    }

    // Send purchase receipt only if update occurred
    if (didUpdate) {
      const updatedOrder = await Order.findById(order._id).populate<{
        user: { email: string; name: string }
      }>('user', 'name email')
      if (updatedOrder?.user && (updatedOrder as any).user.email) {
        await sendPurchaseReceipt({ order: updatedOrder as any })
      }
    }

    // Send Telegram notification for paid order (non-blocking)
    try {
      if (didUpdate) {
        // Use fresh order state with populated user field
        const o = await Order.findById(order._id).populate<{
          user: { email: string; name: string }
        }>('user', 'name email')
        if (o) await sendOrderPaidNotification(o as any)
      }
    } catch (telegramError) {
      // Don't fail the payment confirmation if Telegram fails
    }

    revalidatePath(`/account/orders/${orderId}`)
    return { success: true, message: 'Order paid successfully' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}
const updateProductStock = async (
  orderId: string,
  paymentResult?: { id?: string; status?: string; email_address?: string; [key: string]: any }
) => {
  const session = await mongoose.connection.startSession()
  try {
    session.startTransaction()
    const opts = { session }

    const order = await Order.findOneAndUpdate(
      { _id: orderId, isPaid: false },
      {
        isPaid: true,
        paidAt: new Date(),
        ...(paymentResult ? { paymentResult: paymentResult as any } : {}),
      },
      opts
    )
    // Idempotent no-op: if already paid (no match), exit without adjusting stock
    if (!order) {
      await session.abortTransaction()
      return { updated: false }
    }

    // Process each item in the order
    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session)
      if (!product) throw new Error('Product not found')

      // Update product stock with negative-stock guard
      const previousStock = product.countInStock
      const newStock = previousStock - item.quantity
      if (newStock < 0) {
        throw new Error(`Insufficient stock for product ${product.sku}`)
      }
      product.countInStock = newStock
      await Product.updateOne(
        { _id: product._id },
        { $inc: { countInStock: -item.quantity, numSales: item.quantity } },
        opts
      )

      // Create stock movement record for the sale inside the transaction
      await StockMovement.create(
        [
          {
            product: item.product,
            sku: product.sku,
            type: 'SALE',
            quantity: -item.quantity,
            previousStock,
            newStock,
            reason: `Sale - Order #${orderId}`,
            notes: `Stock reduced due to order payment confirmation`,
            createdBy: order.user as any,
          },
        ],
        opts
      )
    }

    await session.commitTransaction()
    return { updated: true }
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    try { session.endSession() } catch {}
  }
}
export async function deliverOrder(orderId: string) {
  try {
    await connectToDatabase()
    const order = await Order.findById(orderId).populate<{
      user: { email: string; name: string }
    }>('user', 'name email')
    if (!order) throw new Error('Order not found')
    if (!order.isPaid) throw new Error('Order is not paid')
    order.isDelivered = true
    order.deliveredAt = new Date()
    await order.save()
    if (order.user.email) await sendAskReviewOrderItems({ order })

    // Send Telegram notification for delivered order (non-blocking)
    try {
      await sendOrderDeliveredNotification(order)
    } catch (telegramError) {
      // Don't fail the delivery confirmation if Telegram fails
    }

    revalidatePath(`/account/orders/${orderId}`)
    return { success: true, message: 'Order delivered successfully' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

// DELETE
export async function deleteOrder(id: string) {
  try {
    // 1. Require admin permission
    await requirePermission('orders.delete');

    await connectToDatabase();

    // 2. Verify order exists and get details for audit
    const order = await Order.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    // 3. Additional business logic validation
    if (order.isPaid && !order.isDelivered) {
      throw new Error('Cannot delete paid orders that are being processed. Please contact support.');
    }

    // 4. Get current user for audit log
    const session = await auth();

    // 5. Log before deletion for audit trail
    console.log(`[AUDIT] Order ${id} deleted by user ${session!.user.id} (role: ${session!.user.role})`);
    console.log(`[AUDIT] Order details - Value: ${order.totalPrice}, Items: ${order.items.length}, Status: ${order.isPaid ? 'Paid' : 'Unpaid'}`);

    // 6. Perform deletion
    const res = await Order.findByIdAndDelete(id);
    if (!res) throw new Error('Order not found');

    revalidatePath('/admin/orders');
    return {
      success: true,
      message: 'Order deleted successfully',
    };
  } catch (error) {
    console.error(`[ERROR] Order deletion failed for ${id}:`, error);
    return { success: false, message: formatError(error) };
  }
}

// GET ALL ORDERS

// GET ORDERS FOR EXPORT (No pagination, for Excel export)
export async function getOrdersForExport({
  search,
  status,
  dateRange,
  startDate,
  endDate,
}: {
  search?: string
  status?: string
  dateRange?: string
  startDate?: Date
  endDate?: Date
}) {
  try {
    // Check permission
    await requirePermission('orders.export')
    
    await connectToDatabase()
    
    // Ensure models are registered
    void User
    
    // Build filter query (reuse same logic as getAllOrders)
    const query: any = {}

    // Search filter
    if (search && search.trim()) {
      const searchTerm = search.trim()
      const searchRegex = new RegExp(searchTerm, 'i')
      
      const matchingUsers = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id')
      
      const userIds = matchingUsers.map(u => u._id)
      
      const orderNumberPattern = /^ORD-\d{6}-([A-Z0-9]{4})$/i
      const orderNumberMatch = searchTerm.match(orderNumberPattern)
      
      const orConditions = []
      
      if (userIds.length > 0) {
        orConditions.push({ user: { $in: userIds } })
      }
      
      if (orderNumberMatch) {
        const lastFourChars = orderNumberMatch[1].toUpperCase()
        const allOrders = await Order.find({}).select('_id')
        const matchingOrderIds = allOrders
          .filter(order => order._id.toString().slice(-4).toUpperCase() === lastFourChars)
          .map(order => order._id)
        
        if (matchingOrderIds.length > 0) {
          orConditions.push({ _id: { $in: matchingOrderIds } })
        }
      } else if (mongoose.Types.ObjectId.isValid(searchTerm)) {
        orConditions.push({ _id: searchTerm })
      } else if (searchTerm.length === 4) {
        const allOrders = await Order.find({}).select('_id')
        const matchingOrderIds = allOrders
          .filter(order => order._id.toString().slice(-4).toUpperCase() === searchTerm.toUpperCase())
          .map(order => order._id)
        
        if (matchingOrderIds.length > 0) {
          orConditions.push({ _id: { $in: matchingOrderIds } })
        }
      }
      
      if (orConditions.length > 0) {
        query.$or = orConditions
      } else {
        query.$or = [{ _id: null }]
      }
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'pending') {
        query.isPaid = false
      } else if (status === 'paid') {
        query.isPaid = true
      } else if (status === 'delivered') {
        query.isPaid = true
        query.isDelivered = true
      }
    }

    // Date range filter - use custom dates if provided, otherwise use preset ranges
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate }
    } else if (dateRange && dateRange !== 'all') {
      const now = new Date()
      let start: Date
      let end: Date | undefined

      if (dateRange === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      } else if (dateRange === 'last7days') {
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        start.setHours(0, 0, 0, 0)
      } else if (dateRange === 'last30days') {
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        start.setHours(0, 0, 0, 0)
      } else if (dateRange === 'thisMonth') {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      } else if (dateRange === 'lastMonth') {
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        start = firstDayOfLastMonth
        end = lastDayOfLastMonth
      } else {
        start = new Date(0)
      }

      if (end) {
        query.createdAt = { $gte: start, $lte: end }
      } else {
        query.createdAt = { $gte: start }
      }
    }

    // Limit to 10,000 orders for export to prevent memory issues
    const MAX_EXPORT_ROWS = 10000
    const ordersCount = await Order.countDocuments(query)
    
    if (ordersCount > MAX_EXPORT_ROWS) {
      return {
        success: false,
        message: `Too many orders to export (${ordersCount}). Please narrow your filters. Maximum: ${MAX_EXPORT_ROWS} orders.`,
        data: null
      }
    }

    // Fetch all orders with populated data
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: 'desc' })
      .lean()

    return {
      success: true,
      message: `Found ${orders.length} orders for export`,
      data: JSON.parse(JSON.stringify(orders)) as IOrderList[]
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
      data: null
    }
  }
}

export async function getAllOrders({
  limit,
  page,
  search,
  status,
  dateRange,
}: {
  limit?: number
  page: number
  search?: string
  status?: string
  dateRange?: string
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  
  // Build filter query
  const query: any = {}

  // Search filter - search by order ID, customer name, or email
  if (search && search.trim()) {
    const searchTerm = search.trim()
    const searchRegex = new RegExp(searchTerm, 'i')
    
    // Get users matching the search
    const matchingUsers = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    }).select('_id')
    
    const userIds = matchingUsers.map(u => u._id)
    
    // Check if search term matches formatted order number pattern (ORD-YYMMDD-XXXX)
    const orderNumberPattern = /^ORD-\d{6}-([A-Z0-9]{4})$/i
    const orderNumberMatch = searchTerm.match(orderNumberPattern)
    
    const orConditions = []
    
    // Add user search condition
    if (userIds.length > 0) {
      orConditions.push({ user: { $in: userIds } })
    }
    
    if (orderNumberMatch) {
      // Extract last 4 characters from formatted order number
      const lastFourChars = orderNumberMatch[1].toUpperCase()
      
      // Find all orders and filter by ObjectId ending
      const allOrders = await Order.find({}).select('_id')
      const matchingOrderIds = allOrders
        .filter(order => order._id.toString().slice(-4).toUpperCase() === lastFourChars)
        .map(order => order._id)
      
      if (matchingOrderIds.length > 0) {
        orConditions.push({ _id: { $in: matchingOrderIds } })
      }
    } else if (mongoose.Types.ObjectId.isValid(searchTerm)) {
      // Direct ObjectId search
      orConditions.push({ _id: searchTerm })
    } else if (searchTerm.length === 4) {
      // Search by last 4 characters of ObjectId
      const allOrders = await Order.find({}).select('_id')
      const matchingOrderIds = allOrders
        .filter(order => order._id.toString().slice(-4).toUpperCase() === searchTerm.toUpperCase())
        .map(order => order._id)
      
      if (matchingOrderIds.length > 0) {
        orConditions.push({ _id: { $in: matchingOrderIds } })
      }
    }
    
    // Set query conditions
    if (orConditions.length > 0) {
      query.$or = orConditions
    } else {
      // Force no results if no valid conditions
      query.$or = [{ _id: null }]
    }
  }

  // Status filter
  if (status && status !== 'all') {
    if (status === 'pending') {
      // Unpaid orders only
      query.isPaid = false
    } else if (status === 'paid') {
      // All paid orders (regardless of delivery status)
      query.isPaid = true
    } else if (status === 'delivered') {
      // Delivered orders (must be both paid and delivered)
      query.isPaid = true
      query.isDelivered = true
    }
  }

  // Date range filter
  if (dateRange && dateRange !== 'all') {
    const now = new Date()
    let startDate: Date
    let endDate: Date | undefined

    if (dateRange === 'today') {
      // Today from 00:00:00 to 23:59:59
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    } else if (dateRange === 'last7days') {
      // Last 7 days (including today)
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      startDate.setHours(0, 0, 0, 0)
    } else if (dateRange === 'last30days') {
      // Last 30 days (including today)
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      startDate.setHours(0, 0, 0, 0)
    } else if (dateRange === 'thisMonth') {
      // This month from 1st to today
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    } else if (dateRange === 'lastMonth') {
      // Previous month from 1st to last day
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      startDate = firstDayOfLastMonth
      endDate = lastDayOfLastMonth
    } else {
      startDate = new Date(0) // Beginning of time
    }

    if (endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate }
    } else {
      query.createdAt = { $gte: startDate }
    }
  }

  const skipAmount = (Number(page) - 1) * limit
  const orders = await Order.find(query)
    .populate('user', 'name')
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  
  // Get counts based on the current query filters
  const ordersCount = await Order.countDocuments(query)
  const paidOrdersCount = await Order.countDocuments({ ...query, isPaid: true })
  const deliveredOrdersCount = await Order.countDocuments({ ...query, isDelivered: true })
  
  // Calculate total revenue from filtered paid orders
  const revenueResult = await Order.aggregate([
    { $match: { ...query, isPaid: true } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ])
  const totalRevenue = revenueResult[0]?.total || 0
  
  return {
    data: JSON.parse(JSON.stringify(orders)) as IOrderList[],
    totalPages: Math.ceil(ordersCount / limit),
    totalOrders: ordersCount,
    totalPaidOrders: paidOrdersCount,
    totalDeliveredOrders: deliveredOrdersCount,
    totalRevenue: totalRevenue,
  }
}
export async function getMyOrders({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const session = await auth()
  if (!session) {
    throw new Error('User is not authenticated')
  }
  const skipAmount = (Number(page) - 1) * limit
  const orders = await Order.find({
    user: session?.user?.id,
  })
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const ordersCount = await Order.countDocuments({ user: session?.user?.id })

  return {
    data: JSON.parse(JSON.stringify(orders)),
    totalPages: Math.ceil(ordersCount / limit),
  }
}
export async function getOrderById(orderId: string): Promise<IOrder> {
  await connectToDatabase()
  const order = await Order.findById(orderId)
    .populate('user', 'name email')
  return JSON.parse(JSON.stringify(order))
}





// Cache for delivery calculations to avoid redundant server calls
const deliveryCalculationCache = new Map<string, any>()

export const calcDeliveryDateAndPrice = async ({
  items,
  shippingAddress,
  deliveryDateIndex,
}: {
  deliveryDateIndex?: number
  items: OrderItem[]
  shippingAddress?: ShippingAddress
}) => {
  // Input validation
  if (!items || !Array.isArray(items)) {
    throw new Error('Invalid items array')
  }

  // Create cache key for identical inputs
  const cacheKey = JSON.stringify({ items, shippingAddress, deliveryDateIndex })

  // Check cache first
  if (deliveryCalculationCache.has(cacheKey)) {
    return deliveryCalculationCache.get(cacheKey)
  }

  try {
    await connectToDatabase()
    const { availableDeliveryDates } = await getSetting()

    // Fetch current products and compute effective pricing
    const productIds = [...new Set(items.map(item => item.product))]
    const products = await Product.find(
      { _id: { $in: productIds } },
      { saleStartDate: 1, saleEndDate: 1, price: 1, listPrice: 1 }
    )

    const productMap = new Map(products.map(p => [p._id.toString(), p]))

    const itemsPrice = round2(
      items.reduce((acc, item) => {
        if (!item.quantity) return acc
        const product = productMap.get(item.product)
        if (!product) return acc + (item.price || 0) * item.quantity

        const effectivePrice = getEffectivePrice(product, new Date())
        return acc + effectivePrice * item.quantity
      }, 0)
    )

    // Handle empty availableDeliveryDates by setting deliveryDateIndex to 0 and deliveryDate to undefined
    let adjustedDeliveryDateIndex = deliveryDateIndex === undefined
      ? Math.max(0, availableDeliveryDates.length - 1)
      : deliveryDateIndex

    // If no dates exist, set index to 0 and deliveryDate to undefined
    if (availableDeliveryDates.length === 0) {
      adjustedDeliveryDateIndex = 0
    }

    const deliveryDate = availableDeliveryDates.length > 0
      ? availableDeliveryDates[Math.min(adjustedDeliveryDateIndex, availableDeliveryDates.length - 1)]
      : undefined
    const shippingPrice =
      !shippingAddress || !deliveryDate
        ? undefined
        : deliveryDate.shippingPrice

    const taxPrice = !shippingAddress ? undefined : round2(itemsPrice * 0.15)
    const totalPrice = round2(
      itemsPrice +
        (shippingPrice ? round2(shippingPrice) : 0) +
        (taxPrice ? round2(taxPrice) : 0)
    )

    const result = {
      availableDeliveryDates,
      deliveryDateIndex: adjustedDeliveryDateIndex,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    }

    // Cache the result (with a reasonable limit to prevent memory leaks)
    if (deliveryCalculationCache.size > 100) {
      deliveryCalculationCache.clear()
    }
    deliveryCalculationCache.set(cacheKey, result)

    return result
  } catch (error) {
    console.error('Failed to calculate delivery date and price:', error)
    // Return fallback calculation
    const itemsPrice = round2(
      items.reduce((acc, item) => {
        if (!item.price || !item.quantity) return acc
        return acc + item.price * item.quantity
      }, 0)
    )
    return {
      availableDeliveryDates: [],
      deliveryDateIndex: 0,
      itemsPrice,
      shippingPrice: undefined,
      taxPrice: undefined,
      totalPrice: itemsPrice,
    }
  }
}

// GET ORDERS BY USER
export async function getOrderSummary(date: DateRange) {
  await connectToDatabase()

  const ordersCount = await Order.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })
  const productsCount = await Product.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })
  const usersCount = await User.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })

  const totalSalesResult = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    {
      $group: {
        _id: null,
        sales: { $sum: '$totalPrice' },
      },
    },
    { $project: { totalSales: { $ifNull: ['$sales', 0] } } },
  ])
  const totalSales = totalSalesResult[0] ? totalSalesResult[0].totalSales : 0

  // Calculate Average Order Value (AOV)
  const averageOrderValue = ordersCount > 0 ? totalSales / ordersCount : 0

  // Get stock metrics
  const lowStockCount = await Product.countDocuments({
    countInStock: { $lte: 10, $gt: 0 }
  })
  const outOfStockCount = await Product.countDocuments({ countInStock: 0 })

  // Calculate previous period for comparison
  const periodDuration = date.to && date.from ? date.to.getTime() - date.from.getTime() : 0
  const previousPeriodEnd = date.from ? new Date(date.from.getTime() - 1) : new Date()
  const previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodDuration)

  // Get previous period metrics for trend comparison
  const previousPeriodOrdersCount = await Order.countDocuments({
    createdAt: {
      $gte: previousPeriodStart,
      $lte: previousPeriodEnd,
    },
  })

  const previousPeriodSalesResult = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: previousPeriodStart,
          $lte: previousPeriodEnd,
        },
      },
    },
    {
      $group: {
        _id: null,
        sales: { $sum: '$totalPrice' },
      },
    },
    { $project: { totalSales: { $ifNull: ['$sales', 0] } } },
  ])
  const previousPeriodSales = previousPeriodSalesResult[0] ? previousPeriodSalesResult[0].totalSales : 0
  const previousAverageOrderValue = previousPeriodOrdersCount > 0 ? previousPeriodSales / previousPeriodOrdersCount : 0

  const previousPeriodUsersCount = await User.countDocuments({
    createdAt: {
      $gte: previousPeriodStart,
      $lte: previousPeriodEnd,
    },
  })

  // Calculate percentage changes
  const salesChange = previousPeriodSales > 0 
    ? ((totalSales - previousPeriodSales) / previousPeriodSales) * 100 
    : 0
  const ordersChange = previousPeriodOrdersCount > 0 
    ? ((ordersCount - previousPeriodOrdersCount) / previousPeriodOrdersCount) * 100 
    : 0
  const usersChange = previousPeriodUsersCount > 0 
    ? ((usersCount - previousPeriodUsersCount) / previousPeriodUsersCount) * 100 
    : 0
  const aovChange = previousAverageOrderValue > 0 
    ? ((averageOrderValue - previousAverageOrderValue) / previousAverageOrderValue) * 100 
    : 0

  const today = new Date()
  const sixMonthEarlierDate = new Date(
    today.getFullYear(),
    today.getMonth() - 5,
    1
  )
  const monthlySales = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: sixMonthEarlierDate,
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    {
      $project: {
        _id: 0,
        label: '$_id',
        value: '$totalSales',
      },
    },

    { $sort: { label: -1 } },
  ])
  const topSalesCategories = await getTopSalesCategories(date)
  const topSalesProducts = await getTopSalesProducts(date)

  const {
    common: { pageSize },
  } = await getSetting()
  const limit = pageSize
  const latestOrders = await Order.find()
    .populate('user', 'name')
    .sort({ createdAt: 'desc' })
    .limit(limit)
  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales,
    averageOrderValue,
    lowStockCount,
    outOfStockCount,
    // Trend data
    salesChange,
    ordersChange,
    usersChange,
    aovChange,
    monthlySales: JSON.parse(JSON.stringify(monthlySales)),
    salesChartData: JSON.parse(JSON.stringify(await getSalesChartData(date))),
    topSalesCategories: JSON.parse(JSON.stringify(topSalesCategories)),
    topSalesProducts: JSON.parse(JSON.stringify(topSalesProducts)),
    latestOrders: JSON.parse(JSON.stringify(latestOrders)) as IOrderList[],
  }
}

async function getSalesChartData(date: DateRange) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    {
      $project: {
        _id: 0,
        date: {
          $concat: [
            { $toString: '$_id.year' },
            '/',
            { $toString: '$_id.month' },
            '/',
            { $toString: '$_id.day' },
          ],
        },
        totalSales: 1,
      },
    },
    { $sort: { date: 1 } },
  ])

  return result
}

async function getTopSalesProducts(date: DateRange) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    // Step 1: Unwind orderItems array
    { $unwind: '$items' },

    // Step 2: Group by productId to calculate total sales per product
    {
      $group: {
        _id: {
          name: '$items.name',
          image: '$items.image',
          _id: '$items.product',
        },
        totalSales: {
          $sum: { $multiply: ['$items.quantity', '$items.price'] },
        }, // Assume quantity field in orderItems represents units sold
      },
    },
    {
      $sort: {
        totalSales: -1,
      },
    },
    { $limit: 6 },

    // Step 3: Replace productInfo array with product name and format the output
    {
      $project: {
        _id: 0,
        id: '$_id._id',
        label: '$_id.name',
        image: '$_id.image',
        value: '$totalSales',
      },
    },

    // Step 4: Sort by totalSales in descending order
    { $sort: { _id: 1 } },
  ])

  return result
}

async function getTopSalesCategories(date: DateRange, limit = 5) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    // Step 1: Unwind orderItems array
    { $unwind: '$items' },
    // Step 2: Try to convert category to ObjectId (only if it's a valid ObjectId string)
    {
      $addFields: {
        categoryId: {
          $cond: {
            if: {
              $and: [
                { $eq: [{ $type: '$items.category' }, 'string'] },
                { $eq: [{ $strLenCP: '$items.category' }, 24] }
              ]
            },
            then: { $toObjectId: '$items.category' },
            else: null
          }
        }
      }
    },
    // Step 3: Lookup category details (only for ObjectIds)
    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    // Step 4: Unwind category info
    { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
    // Step 5: Group by category name (use lookup result if available, otherwise use original value)
    {
      $group: {
        _id: { 
          $cond: {
            if: { $ifNull: ['$categoryInfo.name', false] },
            then: '$categoryInfo.name',
            else: '$items.category'
          }
        },
        totalSales: { $sum: '$items.quantity' },
      },
    },
    // Step 6: Sort by totalSales in descending order
    { $sort: { totalSales: -1 } },
    // Step 4: Limit to top N products
    { $limit: limit },
  ])

  return result
}

// CREATE MANUAL ORDER (for admin offline orders)
export const createManualOrder = async (orderData: any) => {
  try {
    // Check if current user has permission to create orders
    await requirePermission('orders.create')

    await connectToDatabase()

    // Create or find user by email/phone
    let user
    const existingUser = await User.findOne({
      $or: [
        { email: orderData.customerInfo.email },
        { phone: orderData.customerInfo.phone }
      ]
    })

    if (existingUser) {
      user = existingUser
    } else {
      // Create new user for the customer
      user = await User.create({
        name: orderData.customerInfo.name,
        email: orderData.customerInfo.email || `${orderData.customerInfo.phone}@temp.com`,
        phone: orderData.customerInfo.phone,
        role: 'user',
        emailVerified: false,
      })
    }

    // Validate stock availability
    for (const item of orderData.items) {
      const product = await Product.findById(item.product)
      if (!product) {
        throw new Error(`Product ${item.name} not found`)
      }
      if (product.countInStock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}. Available: ${product.countInStock}`)
      }
    }

    // Use the expected delivery date from the order data
    const expectedDeliveryDate = orderData.expectedDeliveryDate || new Date()

    // Get current admin session for internal notes
    const session = await auth()
    
    // Prepare order data
    const order = {
      user: user._id,
      items: orderData.items.map((item: any) => ({
        product: item.product,
        clientId: item.clientId || `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        slug: item.slug,
        sku: item.sku,
        image: item.image,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        countInStock: item.countInStock,
        color: item.color || '',
        size: item.size || '',
      })),
      shippingAddress: orderData.shippingAddress,
      expectedDeliveryDate,
      paymentMethod: orderData.paymentMethod,
      itemsPrice: orderData.itemsPrice,
      shippingPrice: orderData.shippingPrice,
      taxPrice: orderData.taxPrice,
      totalPrice: orderData.totalPrice,
      isPaid: orderData.isPaid,
      paidAt: orderData.isPaid ? new Date() : undefined,
      isDelivered: false,
      // Add internal note if notes provided
      internalNotes: orderData.notes && orderData.notes.trim() && session?.user?.id ? [
        {
          note: orderData.notes.trim(),
          createdBy: session.user.id,
          createdAt: new Date(),
        }
      ] : [],
    }

    // Create the order
    const createdOrder = await Order.create(order)

    // Update product stock
    for (const item of orderData.items) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            countInStock: -item.quantity,
            numSales: item.quantity,
          },
        }
      )

      // Create stock movement record
      await createSaleStockMovement(
        item.product,
        item.quantity,
        `Manual order: ${createdOrder._id}`,
        user._id
      )
    }

    // Send notifications if order is paid
    if (orderData.isPaid) {
      try {
        await sendPurchaseReceipt({ order: createdOrder })
        await sendOrderPaidNotification(createdOrder)
      } catch (emailError) {
        console.warn('Failed to send email notifications:', emailError)
      }
    }

    revalidatePath('/admin/orders')

    return {
      success: true,
      message: 'Order created successfully',
      data: { orderId: createdOrder._id.toString() },
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Add internal note to order (admin only)
export async function addInternalNote(
  orderId: string,
  note: string
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session || session.user.role?.toLowerCase() !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    await connectToDatabase()

    const order = await Order.findById(orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    // Add the note
    order.internalNotes.push({
      note,
      createdBy: session.user.id,
      createdAt: new Date(),
    })

    await order.save()

    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath('/admin/orders')

    return {
      success: true,
      message: 'Note added successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Get order with populated internal notes
export async function getOrderWithNotes(orderId: string) {
  try {
    await connectToDatabase()

    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .populate('internalNotes.createdBy', 'name')

    if (!order) {
      return null
    }

    return JSON.parse(JSON.stringify(order))
  } catch (error) {
    console.error('Error fetching order with notes:', error)
    return null
  }
}

// Helper function to generate address key
function generateAddressKey(addr: ShippingAddress): string {
  // Handle both Cambodia and legacy address formats
  const parts = [
    addr.fullName?.trim().toLowerCase(),
    addr.phone?.trim(),
  ]
  
  // Cambodia address
  if ('houseNumber' in addr && addr.houseNumber) {
    parts.push(addr.houseNumber.trim().toLowerCase())
  }
  if ('street' in addr && addr.street) {
    parts.push(addr.street.trim().toLowerCase())
  }
  if ('communeCode' in addr && addr.communeCode) {
    parts.push(addr.communeCode.trim())
  }
  
  // Legacy address (fallback)
  if ('city' in addr && addr.city) {
    parts.push(addr.city.trim().toLowerCase())
  }
  if ('province' in addr && addr.province) {
    parts.push(addr.province.trim().toLowerCase())
  }
  
  return parts.filter(Boolean).join('-')
}

// Get unique addresses from user's orders
export async function getUserAddressesFromOrders(userId: string) {
  try {
    await connectToDatabase()
    
    // Get user's default address
    const user = await User.findById(userId).select('address').lean()
    if (!user) {
      return { success: false, message: 'User not found', data: [], defaultAddress: null }
    }
    
    const defaultAddress = user.address || null
    
    const orders = await Order.find({ user: userId })
      .select('shippingAddress createdAt')
      .sort({ createdAt: -1 })
      .lean()
    
    if (!orders || orders.length === 0) {
      return { success: true, data: [], defaultAddress }
    }
    
    // Group addresses by unique key
    const addressMap = new Map<string, {
      address: ShippingAddress
      orderCount: number
      lastUsed: Date
      firstUsed: Date
      key: string
      isDefault: boolean
    }>()
    
    orders.forEach((order) => {
      if (!order.shippingAddress) return
      
      const addr = order.shippingAddress
      // Create unique key based on address details
      const key = generateAddressKey(addr)
      
      if (addressMap.has(key)) {
        const existing = addressMap.get(key)!
        existing.orderCount++
        // Keep track of last used (most recent)
        if (new Date(order.createdAt!) > new Date(existing.lastUsed)) {
          existing.lastUsed = order.createdAt!
        }
      } else {
        // Check if this address is the default
        const isDefault = defaultAddress ? generateAddressKey(defaultAddress as ShippingAddress) === key : false
        
        addressMap.set(key, {
          address: addr,
          orderCount: 1,
          lastUsed: order.createdAt!,
          firstUsed: order.createdAt!,
          key,
          isDefault
        })
      }
    })
    
    // Convert to array and sort by last used (most recent first)
    const addresses = Array.from(addressMap.values())
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    
    return { success: true, data: addresses, defaultAddress }
  } catch (error) {
    return { success: false, message: formatError(error), data: [], defaultAddress: null }
  }
}
