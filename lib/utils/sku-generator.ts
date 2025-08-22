import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'

/**
 * Normalizes a string for SKU generation by:
 * - Converting to uppercase
 * - Removing special characters and spaces
 * - Replacing multiple consecutive non-alphanumeric chars with single dash
 * - Removing leading/trailing dashes
 */
function normalizeForSKU(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 10) // Limit length to keep SKUs manageable
}

/**
 * Generates a unique SKU in the format: BRAND-CATEGORY-SEQUENCE
 * Example: NIKE-TSHIRT-001, ADIDAS-SHOES-002
 */
export async function generateSKU(brand: string, category: string): Promise<string> {
  await connectToDatabase()
  
  const normalizedBrand = normalizeForSKU(brand)
  const normalizedCategory = normalizeForSKU(category)
  
  // Create the base SKU pattern
  const basePattern = `${normalizedBrand}-${normalizedCategory}`
  
  // Find the highest sequence number for this brand-category combination
  const existingProducts = await Product.find({
    sku: { $regex: `^${basePattern}-\\d+$` }
  }).select('sku').lean()
  
  let maxSequence = 0
  
  for (const product of existingProducts) {
    const match = product.sku.match(/-(\d+)$/)
    if (match) {
      const sequence = parseInt(match[1], 10)
      if (sequence > maxSequence) {
        maxSequence = sequence
      }
    }
  }
  
  // Generate the next sequence number with leading zeros
  const nextSequence = (maxSequence + 1).toString().padStart(3, '0')
  
  return `${basePattern}-${nextSequence}`
}

/**
 * Validates if a SKU is unique in the database
 */
export async function isSkuUnique(sku: string, excludeProductId?: string): Promise<boolean> {
  await connectToDatabase()
  
  const query: Record<string, unknown> = { sku: sku.toUpperCase() }
  if (excludeProductId) {
    query._id = { $ne: excludeProductId }
  }
  
  const existingProduct = await Product.findOne(query).select('_id').lean()
  return !existingProduct
}

/**
 * Generates a unique SKU, ensuring it doesn't conflict with existing ones
 * If the generated SKU already exists, it will increment the sequence
 */
export async function generateUniqueSKU(brand: string, category: string): Promise<string> {
  let sku = await generateSKU(brand, category)
  let attempts = 0
  const maxAttempts = 100
  
  while (!(await isSkuUnique(sku)) && attempts < maxAttempts) {
    attempts++
    // If SKU exists, try with a higher sequence number
    const match = sku.match(/^(.+)-(\d+)$/)
    if (match) {
      const base = match[1]
      const currentSequence = parseInt(match[2], 10)
      const nextSequence = (currentSequence + attempts).toString().padStart(3, '0')
      sku = `${base}-${nextSequence}`
    } else {
      // Fallback: append attempt number
      sku = `${sku}-${attempts.toString().padStart(3, '0')}`
    }
  }
  
  if (attempts >= maxAttempts) {
    throw new Error(`Unable to generate unique SKU for ${brand}-${category} after ${maxAttempts} attempts`)
  }
  
  return sku
}

/**
 * Validates SKU format
 */
export function validateSkuFormat(sku: string): boolean {
  // SKU should be uppercase alphanumeric with dashes, minimum 3 characters
  const skuRegex = /^[A-Z0-9-]{3,}$/
  return skuRegex.test(sku)
}

/**
 * Suggests a SKU based on product name if brand/category are not clear
 */
export function suggestSkuFromName(productName: string): string {
  const normalized = normalizeForSKU(productName)
  return normalized.substring(0, 15) // Limit to reasonable length
}
