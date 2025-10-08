import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import qs from 'query-string'

export function formUrlQuery({
  params,
  key,
  value,
}: {
  params: string
  key: string
  value: string | null
}) {
  const currentUrl = qs.parse(params)

  currentUrl[key] = value

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    { skipNull: true }
  )
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNumberWithDecimal = (num: number): string => {
  const [int, decimal] = num.toString().split('.')
  return decimal ? `${int}.${decimal.padEnd(2, '0')}` : int
}
// PROMPT: [ChatGTP] create toSlug ts arrow function that convert text to lowercase, remove non-word,
// non-whitespace, non-hyphen characters, replace whitespace, trim leading hyphens and trim trailing hyphens

export const toSlug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
  minimumFractionDigits: 2,
})
export function formatCurrency(amount: number) {
  return CURRENCY_FORMATTER.format(amount)
}

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')
export function formatNumber(number: number) {
  return NUMBER_FORMATTER.format(number)
}

export const round2 = (num: number) =>
  Math.round((num + Number.EPSILON) * 100) / 100

export const generateId = () =>
  Array.from({ length: 24 }, () => Math.floor(Math.random() * 10)).join('')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const formatError = (error: any): string => {
  if (error.name === 'ZodError') {
    const fieldErrors = Object.keys(error.errors).map((field) => {
      const errorMessage = error.errors[field].message
      return `${error.errors[field].path}: ${errorMessage}` // field: errorMessage
    })
    return fieldErrors.join('. ')
  } else if (error.name === 'ValidationError') {
    const fieldErrors = Object.keys(error.errors).map((field) => {
      const errorMessage = error.errors[field].message
      return errorMessage
    })
    return fieldErrors.join('. ')
  } else if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyValue)[0]
    return `${duplicateField} already exists`
  } else {
    // return 'Something went wrong. please try again'
    return typeof error.message === 'string'
      ? error.message
      : JSON.stringify(error.message)
  }
}

export function calculateFutureDate(days: number) {
  const currentDate = new Date()
  currentDate.setDate(currentDate.getDate() + days)
  return currentDate
}
export function getMonthName(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const date = new Date(year, month - 1)
  const monthName = date.toLocaleString('default', { month: 'long' })
  const now = new Date()

  if (year === now.getFullYear() && month === now.getMonth() + 1) {
    return `${monthName} Ongoing`
  }
  return monthName
}
export function calculatePastDate(days: number) {
  const currentDate = new Date()
  currentDate.setDate(currentDate.getDate() - days)
  return currentDate
}
export function timeUntilMidnight(): { hours: number; minutes: number } {
  const now = new Date()
  const midnight = new Date()
  midnight.setHours(24, 0, 0, 0) // Set to 12:00 AM (next day)

  const diff = midnight.getTime() - now.getTime() // Difference in milliseconds
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { hours, minutes }
}

export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    month: 'short', // abbreviated month name (e.g., 'Oct')
    year: 'numeric', // abbreviated month name (e.g., 'Oct')
    day: 'numeric', // numeric day of the month (e.g., '25')
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  }
  const dateOptions: Intl.DateTimeFormatOptions = {
    // weekday: 'short', // abbreviated weekday name (e.g., 'Mon')
    month: 'short', // abbreviated month name (e.g., 'Oct')
    year: 'numeric', // numeric year (e.g., '2023')
    day: 'numeric', // numeric day of the month (e.g., '25')
  }
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  }
  const formattedDateTime: string = new Date(dateString).toLocaleString(
    'en-US',
    dateTimeOptions
  )
  const formattedDate: string = new Date(dateString).toLocaleString(
    'en-US',
    dateOptions
  )
  const formattedTime: string = new Date(dateString).toLocaleString(
    'en-US',
    timeOptions
  )
  return {
    dateTime: formattedDateTime,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  }
}

export function formatId(id: string) {
  return `..${id.substring(id.length - 6)}`
}

export const getFilterUrl = ({
  params,
  category,
  tag,
  sort,
  price,
  page,
  secondHand,
  discount,
  q,
}: {
  params: {
    q?: string
    category?: string
    tag?: string
    price?: string
    sort?: string
    page?: string
    secondHand?: string
    discount?: string
  }
  tag?: string
  category?: string
  sort?: string
  price?: string
  page?: string
  secondHand?: string
  discount?: string
  q?: string
}) => {
  const newParams = { ...params }
  if (q !== undefined) newParams.q = q
  if (category !== undefined) newParams.category = category
  if (tag !== undefined) newParams.tag = toSlug(tag)
  if (price !== undefined) newParams.price = price
  if (page !== undefined) newParams.page = page
  if (sort !== undefined) newParams.sort = sort
  if (secondHand !== undefined) newParams.secondHand = secondHand
  if (discount !== undefined) newParams.discount = discount
  
  // Remove 'all' values from params
  Object.keys(newParams).forEach((key) => {
    if (newParams[key as keyof typeof newParams] === 'all' || newParams[key as keyof typeof newParams] === '') {
      delete newParams[key as keyof typeof newParams]
    }
  })
  
  return `/search?${new URLSearchParams(newParams).toString()}`
}

// Product pricing utility functions
export const getEffectivePrice = (product: any, date?: Date): number => {
  return product.price
}

export const isProductOnSale = (product: any, date?: Date): boolean => {
  const checkDate = date || new Date()
  if (!product.saleStartDate || !product.saleEndDate) {
    return false
  }
  const startDate = new Date(product.saleStartDate)
  const endDate = new Date(product.saleEndDate)
  return checkDate >= startDate && checkDate <= endDate
}

// Variant pricing utilities
export type VariantModifier = {
  type: 'storage' | 'ram' | 'color' | 'size'
  value: string
  priceModifier: number
}

/**
 * Calculate total price including variant modifiers
 */
export function calculateVariantPrice(
  basePrice: number,
  variantModifiers?: VariantModifier[]
): number {
  if (!variantModifiers || variantModifiers.length === 0) {
    return round2(basePrice)
  }
  
  const totalModifier = variantModifiers.reduce(
    (sum, modifier) => sum + (modifier.priceModifier || 0),
    0
  )
  
  return round2(basePrice + totalModifier)
}

/**
 * Calculate price range for products with variants
 */
export function getProductPriceRange(product: any): {
  min: number
  max: number
  hasRange: boolean
} {
  const basePrice = product?.price
  
  // Safety check: ensure basePrice is valid
  if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
    return {
      min: product?.price || 0,
      max: product?.price || 0,
      hasRange: false
    }
  }
  
  // Check if product has price-modifying variants
  const hasVariants = product.variants && (
    (product.variants.storage && product.variants.storage.length > 0) ||
    (product.variants.ram && product.variants.ram.length > 0)
  )
  
  if (!hasVariants) {
    return {
      min: basePrice,
      max: basePrice,
      hasRange: false
    }
  }
  
  // Calculate all possible variant combinations
  const storageModifiers = product.variants?.storage?.map((s: any) => {
    const modifier = s?.priceModifier
    return (typeof modifier === 'number' && !isNaN(modifier)) ? modifier : 0
  }) || [0]
  
  const ramModifiers = product.variants?.ram?.map((r: any) => {
    const modifier = r?.priceModifier
    return (typeof modifier === 'number' && !isNaN(modifier)) ? modifier : 0
  }) || [0]
  
  // Get all combinations of modifiers
  const allModifiers: number[] = []
  for (const storage of storageModifiers) {
    for (const ram of ramModifiers) {
      const combined = storage + ram
      if (!isNaN(combined)) {
        allModifiers.push(combined)
      }
    }
  }
  
  // Safety check: if no valid modifiers, return base price
  if (allModifiers.length === 0) {
    return {
      min: basePrice,
      max: basePrice,
      hasRange: false
    }
  }
  
  const minModifier = Math.min(...allModifiers)
  const maxModifier = Math.max(...allModifiers)
  
  const minPrice = round2(basePrice + minModifier)
  const maxPrice = round2(basePrice + maxModifier)
  
  // Final validation
  if (isNaN(minPrice) || isNaN(maxPrice)) {
    return {
      min: basePrice,
      max: basePrice,
      hasRange: false
    }
  }
  
  return {
    min: minPrice,
    max: maxPrice,
    hasRange: minModifier !== maxModifier
  }
}

/**
 * Validate that calculated price matches expected price
 * Used for server-side validation to prevent price manipulation
 */
export function validateVariantPrice(
  product: any,
  selectedVariants: { storage?: string; ram?: string },
  expectedPrice: number
): { valid: boolean; calculatedPrice: number; difference: number } {
  let calculatedPrice = product.price
  
  // Add storage modifier
  if (selectedVariants.storage && product.variants?.storage) {
    const storageVariant = product.variants.storage.find(
      (s: any) => s.value === selectedVariants.storage
    )
    if (storageVariant) {
      calculatedPrice += storageVariant.priceModifier || 0
    }
  }
  
  // Add RAM modifier
  if (selectedVariants.ram && product.variants?.ram) {
    const ramVariant = product.variants.ram.find(
      (r: any) => r.value === selectedVariants.ram
    )
    if (ramVariant) {
      calculatedPrice += ramVariant.priceModifier || 0
    }
  }
  
  calculatedPrice = round2(calculatedPrice)
  const difference = Math.abs(calculatedPrice - expectedPrice)
  
  return {
    valid: difference < 0.01, // Allow for floating point errors
    calculatedPrice,
    difference
  }
}


