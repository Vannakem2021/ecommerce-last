/**
 * Get order number in readable format
 * Uses custom orderId if available, otherwise generates from MongoDB _id
 * @param order - Order object or _id string
 * @param createdAt - Order creation date (for fallback generation)
 * @param orderId - Custom orderId field (if available)
 * @returns Formatted order number (e.g., ORD-251009-7869)
 */
export const generateOrderNumber = (id: string, createdAt: Date, orderId?: string) => {
  // If custom orderId is provided, use it
  if (orderId) {
    return orderId
  }
  
  // Fallback: Generate from MongoDB _id and date for backward compatibility
  const date = new Date(createdAt)
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const shortId = id.slice(-4).toUpperCase()
  return `ORD-${year}${month}${day}-${shortId}`
}