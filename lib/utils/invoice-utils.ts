import { IOrder } from '@/lib/db/models/order.model'
import { formatDateTime } from '@/lib/utils'

/**
 * Generate a unique invoice number based on order ID and date
 * Format: INV-YYYY-{order_id_suffix}
 */
export function generateInvoiceNumber(order: IOrder): string {
  const year = new Date(order.createdAt).getFullYear()
  const orderIdSuffix = order._id.toString().slice(-6).toUpperCase()
  return `INV-${year}-${orderIdSuffix}`
}

/**
 * Format invoice date for display
 */
export function formatInvoiceDate(date: Date): string {
  return formatDateTime(date).dateOnly
}

/**
 * Calculate line total for an invoice item
 */
export function calculateLineTotal(price: number, quantity: number): number {
  return price * quantity
}

/**
 * Format currency for invoice display
 * Uses the same formatting as the rest of the application
 */
export function formatInvoiceCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Get customer information from order for invoice
 */
export function getInvoiceCustomerInfo(order: IOrder) {
  const user = order.user as { name: string; email: string }
  const address = order.shippingAddress
  
  return {
    name: user?.name || 'Guest Customer',
    email: user?.email || '',
    phone: address.phone || '',
    fullName: address.fullName || user?.name || 'Guest Customer',
    address: formatShippingAddress(address),
  }
}

/**
 * Format shipping address for invoice display
 */
export function formatShippingAddress(address: any): string {
  const parts = []
  
  // Handle Cambodia address format
  if (address.houseNumber || address.street) {
    if (address.houseNumber) parts.push(address.houseNumber)
    if (address.street) parts.push(address.street)
    if (address.communeName) parts.push(address.communeName)
    if (address.districtName) parts.push(address.districtName)
    if (address.provinceName) parts.push(address.provinceName)
  } else {
    // Handle legacy address format
    if (address.city) parts.push(address.city)
    if (address.province) parts.push(address.province)
    if (address.country) parts.push(address.country)
  }
  
  if (address.postalCode) parts.push(address.postalCode)
  
  return parts.filter(Boolean).join(', ')
}

/**
 * Check if order is eligible for invoice generation
 */
export function isOrderInvoiceEligible(order: IOrder): boolean {
  // Only paid orders should have invoices
  return order.isPaid === true
}

/**
 * Get invoice items with calculated totals
 */
export function getInvoiceItems(order: IOrder) {
  return order.items.map((item, index) => ({
    ...item,
    lineNumber: index + 1,
    lineTotal: calculateLineTotal(item.price, item.quantity),
  }))
}

/**
 * Get invoice totals summary
 */
export function getInvoiceTotals(order: IOrder) {
  return {
    subtotal: order.itemsPrice,
    shipping: order.shippingPrice,
    tax: order.taxPrice,
    total: order.totalPrice,
  }
}

/**
 * Validate order data for invoice generation
 */
export function validateOrderForInvoice(order: IOrder): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!order) {
    errors.push('Order not found')
    return { isValid: false, errors }
  }
  
  if (!order.isPaid) {
    errors.push('Order must be paid to generate invoice')
  }
  
  if (!order.items || order.items.length === 0) {
    errors.push('Order must have items')
  }
  
  if (!order.shippingAddress) {
    errors.push('Order must have shipping address')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}
