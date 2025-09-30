/**
 * Server-only password generation utilities
 * Uses Node.js crypto for maximum security - only works on server side
 */

import crypto from 'crypto'

/**
 * Generates a cryptographically secure random password (server-side only)
 * @param length - Length of the password (minimum 12)
 * @param includeSymbols - Whether to include special symbols
 * @returns A secure random password
 */
export function generateSecurePasswordServer(length: number = 16, includeSymbols: boolean = true): string {
  if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
    throw new Error('This function can only be used in a Node.js environment')
  }

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
  password += lowercase[crypto.randomInt(0, lowercase.length)]
  password += uppercase[crypto.randomInt(0, uppercase.length)]
  password += numbers[crypto.randomInt(0, numbers.length)]

  if (includeSymbols) {
    password += symbols[crypto.randomInt(0, symbols.length)]
  }

  // Fill the rest with random characters
  const remainingLength = length - password.length
  for (let i = 0; i < remainingLength; i++) {
    password += charset[crypto.randomInt(0, charset.length)]
  }

  // Shuffle the password to avoid predictable patterns
  return password
    .split('')
    .sort(() => crypto.randomInt(0, 3) - 1)
    .join('')
}

/**
 * Generates passwords specifically for seed data (server-side only)
 * Creates truly random passwords for server-side seeding operations
 */
export function generateSeedPasswordsServer() {
  return {
    admin: generateSecurePasswordServer(16, true),
    manager: generateSecurePasswordServer(16, true),
    seller: generateSecurePasswordServer(16, true),
    user: generateSecurePasswordServer(14, false), // Slightly simpler for users
  }
}

/**
 * Generates a secure API key (server-side only)
 * @param length Length of the API key
 * @returns A secure random API key
 */
export function generateApiKey(length: number = 32): string {
  if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
    throw new Error('This function can only be used in a Node.js environment')
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  for (let i = 0; i < length; i++) {
    result += chars[crypto.randomInt(0, chars.length)]
  }

  return result
}

/**
 * Generates a secure session token (server-side only)
 * @returns A secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generates a secure reset token (server-side only)
 * @returns A secure password reset token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Server-side password strength validation with enhanced security checks
 * @param password Password to validate
 * @returns Enhanced validation result
 */
export function validatePasswordStrengthServer(password: string) {
  const minLength = 12
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)

  // Additional server-side security checks
  const hasRepeatedChars = /(.)\1{2,}/.test(password) // 3+ repeated chars
  const hasCommonPatterns = /123|abc|qwerty|password|admin/i.test(password)
  const hasSequential = /012|123|234|345|456|567|678|789|890|abc|bcd|cde/i.test(password)

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
  if (hasRepeatedChars) {
    issues.push('Password should not contain repeated characters')
  }
  if (hasCommonPatterns) {
    issues.push('Password contains common patterns')
  }
  if (hasSequential) {
    issues.push('Password should not contain sequential characters')
  }

  const isValid = issues.length === 0 || (issues.length === 1 && !hasSymbols)
  const isStrong = isValid && !hasRepeatedChars && !hasCommonPatterns && !hasSequential

  return {
    isValid,
    isStrong,
    issues,
    score: hasLowercase + hasUppercase + hasNumbers + hasSymbols + (password.length >= minLength ? 1 : 0),
    securityFlags: {
      hasRepeatedChars,
      hasCommonPatterns,
      hasSequential
    }
  }
}