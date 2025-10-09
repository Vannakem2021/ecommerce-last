/**
 * Generate a custom order ID in the format: ORD-YYMMDD-XXXX
 * Example: ORD-251009-7869
 * 
 * @returns A unique order ID string
 */
export function generateOrderId(): string {
  const now = new Date()
  
  // Get YY (last 2 digits of year)
  const year = now.getFullYear().toString().slice(-2)
  
  // Get MM (month, zero-padded)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  
  // Get DD (day, zero-padded)
  const day = now.getDate().toString().padStart(2, '0')
  
  // Generate 4-digit random number (0000-9999)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  
  return `ORD-${year}${month}${day}-${random}`
}

/**
 * Validate if a string matches the order ID format
 * @param orderId - The order ID to validate
 * @returns True if valid, false otherwise
 */
export function isValidOrderIdFormat(orderId: string): boolean {
  const orderIdRegex = /^ORD-\d{6}-\d{4}$/
  return orderIdRegex.test(orderId)
}
