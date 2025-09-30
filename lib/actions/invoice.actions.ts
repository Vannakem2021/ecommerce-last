'use server'

import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import Order, { IOrder } from '@/lib/db/models/order.model'
import { formatError } from '@/lib/utils'
import {
  validateOrderForInvoice,
  generateInvoiceNumber,
  getInvoiceCustomerInfo,
  getInvoiceItems,
  getInvoiceTotals
} from '@/lib/utils/invoice-utils'
import { generateOrderNumber } from '@/lib/utils/order-utils'
import { getSetting } from './setting.actions'
import { hasPermission } from '@/lib/rbac-utils'

/**
 * Get invoice data for a specific order
 * Includes all necessary information for invoice generation
 */
export async function getInvoiceData(orderId: string) {
  try {
    await connectToDatabase()
    const session = await auth()
    
    if (!session?.user) {
      return { success: false, message: 'Authentication required' }
    }

    // Get order with populated user data
    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .lean() as IOrder

    if (!order) {
      return { success: false, message: 'Order not found' }
    }

    // Check permissions - users can only access their own orders, admins can access all
    const isAdmin = hasPermission(session.user.role || '', 'orders.read')
    const isOwner = order.user &&
      typeof order.user === 'object' &&
      '_id' in order.user &&
      (order.user as { _id: { toString: () => string } })._id.toString() === session.user.id

    if (!isAdmin && !isOwner) {
      return { success: false, message: 'Access denied' }
    }

    // Validate order for invoice generation
    const validation = validateOrderForInvoice(order)
    if (!validation.isValid) {
      return { 
        success: false, 
        message: `Cannot generate invoice: ${validation.errors.join(', ')}` 
      }
    }

    // Get site settings for company information
    const settings = await getSetting()

    // Prepare invoice data with proper serialization
    const invoiceData = {
      // Invoice metadata
      invoiceNumber: generateInvoiceNumber(order),
      invoiceDate: order.paidAt || order.createdAt,

      // Order information
      orderId: order._id.toString(), // Keep MongoDB ID for internal use
      orderNumber: generateOrderNumber(order._id.toString(), order.createdAt), // User-friendly order number
      orderDate: order.createdAt,
      paymentMethod: order.paymentMethod,
      expectedDeliveryDate: order.expectedDeliveryDate,

      // Company information from settings
      company: {
        name: settings.site.name,
        logo: settings.site.logo,
        email: settings.site.email,
        phone: settings.site.phone,
        address: settings.site.address,
        slogan: settings.site.slogan,
      },

      // Customer information
      customer: getInvoiceCustomerInfo(order),

      // Invoice items with line totals - properly serialized
      items: getInvoiceItems(order).map(item => ({
        lineNumber: item.lineNumber,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        lineTotal: item.lineTotal,
        size: item.size || null,
        color: item.color || null,
        // Remove any MongoDB ObjectId references
        slug: item.slug,
        image: item.image,
        category: item.category,
      })),

      // Totals
      totals: getInvoiceTotals(order),

      // Status information
      isPaid: order.isPaid,
      paidAt: order.paidAt,
      isDelivered: order.isDelivered,
      deliveredAt: order.deliveredAt,
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(invoiceData)), // Ensure complete serialization
    }
  } catch (error) {
    return { 
      success: false, 
      message: formatError(error) 
    }
  }
}

/**
 * Check if user can access invoice for a specific order
 */
export async function canAccessInvoice(orderId: string) {
  try {
    await connectToDatabase()
    const session = await auth()
    
    if (!session?.user) {
      return { success: false, message: 'Authentication required' }
    }

    const order = await Order.findById(orderId).lean() as IOrder
    if (!order) {
      return { success: false, message: 'Order not found' }
    }

    // Check if order is eligible for invoice
    if (!order.isPaid) {
      return { 
        success: false, 
        message: 'Invoice not available - order must be paid' 
      }
    }

    // Check permissions
    const isAdmin = hasPermission(session.user.role || '', 'orders.read')
    const isOwner = order.user && order.user.toString() === session.user.id

    if (!isAdmin && !isOwner) {
      return { success: false, message: 'Access denied' }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      message: formatError(error) 
    }
  }
}

/**
 * Get list of orders that have invoices available for current user
 */
export async function getUserInvoiceableOrders() {
  try {
    await connectToDatabase()
    const session = await auth()
    
    if (!session?.user) {
      return { success: false, message: 'Authentication required' }
    }

    let query = {}
    
    // If not admin, only show user's own orders
    if (!hasPermission(session.user.role || '', 'orders.read')) {
      query = { user: session.user.id }
    }

    // Only get paid orders (eligible for invoices)
    const orders = await Order.find({
      ...query,
      isPaid: true,
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean() as IOrder[]

    const invoiceableOrders = orders.map(order => ({
      orderId: order._id.toString(),
      invoiceNumber: generateInvoiceNumber(order),
      orderDate: order.createdAt,
      paidAt: order.paidAt,
      totalAmount: order.totalPrice,
      customerName: order.user && typeof order.user === 'object' && 'name' in order.user 
        ? order.user.name 
        : 'Guest Customer',
    }))

    return {
      success: true,
      data: invoiceableOrders,
    }
  } catch (error) {
    return { 
      success: false, 
      message: formatError(error) 
    }
  }
}
