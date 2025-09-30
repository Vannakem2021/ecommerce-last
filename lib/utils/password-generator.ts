/**
 * Environment-aware secure random number generator
 * @param min Minimum value (inclusive)
 * @param max Maximum value (exclusive)
 * @returns Random integer between min and max-1
 */
function getSecureRandomInt(min: number, max: number): number {
  // Check if we're in a Node.js environment
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const crypto = require('crypto')
      return crypto.randomInt(min, max)
    } catch (error) {
      // Fallback if crypto is not available
      console.warn('Node.js crypto not available, falling back to Math.random()')
    }
  }

  // Browser or fallback environment
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    // Browser environment with Web Crypto API
    const range = max - min
    const array = new Uint32Array(1)
    window.crypto.getRandomValues(array)
    return min + (array[0] % range)
  } else {
    // Final fallback for environments without crypto
    console.warn('Secure random generation not available, falling back to Math.random()')
    return min + Math.floor(Math.random() * (max - min))
  }
}

/**
 * Generates a cryptographically secure random password (environment-aware)
 * @param length - Length of the password (minimum 12)
 * @param includeSymbols - Whether to include special symbols
 * @returns A secure random password
 */
export function generateSecurePassword(length: number = 16, includeSymbols: boolean = true): string {
  if (length < 12) {
    throw new Error('Password length must be at least 12 characters for security')
  }

  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  let charset = lowercase + uppercase + numbers
  if (includeSymbols) {
    charset += symbols
  }

  let password = ''

  // Ensure at least one character from each required set
  password += lowercase[getSecureRandomInt(0, lowercase.length)]
  password += uppercase[getSecureRandomInt(0, uppercase.length)]
  password += numbers[getSecureRandomInt(0, numbers.length)]

  if (includeSymbols) {
    password += symbols[getSecureRandomInt(0, symbols.length)]
  }

  // Fill the rest with random characters
  const remainingLength = length - password.length
  for (let i = 0; i < remainingLength; i++) {
    password += charset[getSecureRandomInt(0, charset.length)]
  }

  // Shuffle the password to avoid predictable patterns
  return password
    .split('')
    .sort(() => getSecureRandomInt(0, 3) - 1)
    .join('')
}

/**
 * Pre-generated secure passwords for consistent seed data
 * These are used in both server and client environments to ensure consistency
 */
export const STATIC_SEED_PASSWORDS = {
  admin: 'Admin2024!SecureP@ss#Dev',
  manager: 'Manager2024#SecureP@ss$Dev',
  seller: 'Seller2024$SecureP@ss!Dev',
  user: 'User2024SimplePassDev123'
}

/**
 * Generates passwords specifically for seed data
 * Uses static passwords for consistency across environments
 * In production, these should be replaced with properly generated secrets
 */
export function generateSeedPasswords() {
  // For development/testing, use consistent static passwords
  // This ensures the seed data works consistently across server and client
  if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') {
    return STATIC_SEED_PASSWORDS
  }

  // In production, generate secure passwords
  try {
    return {
      admin: generateSecurePassword(16, true),
      manager: generateSecurePassword(16, true),
      seller: generateSecurePassword(16, true),
      user: generateSecurePassword(14, false), // Slightly simpler for users
    }
  } catch (error) {
    console.warn('Failed to generate secure passwords, using static fallback')
    return STATIC_SEED_PASSWORDS
  }
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Object with validation result and feedback
 */
export function validatePasswordStrength(password: string) {
  const minLength = 12
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)

  const issues: string[] = []

  if (password.length < minLength) {
    issues.push(`Password must be at least ${minLength} characters long`)
  }
  if (!hasLowercase) {
    issues.push('Password must contain lowercase letters')
  }
  if (!hasUppercase) {
    issues.push('Password must contain uppercase letters')
  }
  if (!hasNumbers) {
    issues.push('Password must contain numbers')
  }
  if (!hasSymbols) {
    issues.push('Password should contain special symbols for better security')
  }

  const isStrong = issues.length === 0 || (issues.length === 1 && !hasSymbols)

  return {
    isValid: issues.length === 0,
    isStrong,
    issues,
    score: (hasLowercase ? 1 : 0) + (hasUppercase ? 1 : 0) + (hasNumbers ? 1 : 0) + (hasSymbols ? 1 : 0) + (password.length >= minLength ? 1 : 0)
  }
}