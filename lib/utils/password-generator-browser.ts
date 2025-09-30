/**
 * Browser-compatible password generation utilities
 * Uses Web Crypto API for secure random generation in browsers
 */

/**
 * Browser-compatible secure random number generator
 * @param min Minimum value (inclusive)
 * @param max Maximum value (exclusive)
 * @returns Random integer between min and max-1
 */
function getSecureRandomInt(min: number, max: number): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    // Browser environment with Web Crypto API
    const range = max - min
    const array = new Uint32Array(1)
    window.crypto.getRandomValues(array)
    return min + (array[0] % range)
  } else {
    // Fallback for environments without crypto
    console.warn('Secure random generation not available, falling back to Math.random()')
    return min + Math.floor(Math.random() * (max - min))
  }
}

/**
 * Browser-compatible password strength validation
 * @param password Password to validate
 * @returns Validation result
 */
export function validatePasswordStrengthBrowser(password: string) {
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
    score: hasLowercase + hasUppercase + hasNumbers + hasSymbols + (password.length >= minLength ? 1 : 0)
  }
}

/**
 * Generate a secure password in browser environment
 * @param length Password length
 * @param includeSymbols Whether to include symbols
 * @returns Generated password
 */
export function generateSecurePasswordBrowser(length: number = 16, includeSymbols: boolean = true): string {
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
 * Pre-generated secure passwords for seed data (browser-compatible)
 * These are generated at build time to avoid crypto dependencies at runtime
 */
export const BROWSER_SEED_PASSWORDS = {
  admin: 'Admin2024!SecureP@ss',
  manager: 'Manager2024#SecureP@ss',
  seller: 'Seller2024$SecureP@ss',
  user: 'User2024SimplePass123'
}

/**
 * Gets seed passwords in a browser-compatible way
 * @returns Seed passwords object
 */
export function getBrowserSeedPasswords() {
  return BROWSER_SEED_PASSWORDS
}