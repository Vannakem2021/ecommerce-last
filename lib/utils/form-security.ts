/**
 * Form security utilities to prevent weak defaults and insecure patterns
 */

import { isProduction, validateProductionSafety } from './environment'

/**
 * Validates that form defaults are secure and appropriate for the environment
 * @param defaults Form default values
 * @param formName Name of the form for logging
 * @returns Validation result
 */
export function validateFormDefaults(defaults: any, formName: string) {
  // In production, ensure no development data is present
  if (isProduction()) {
    const safetyCheck = validateProductionSafety(defaults, `${formName} form defaults`)

    if (!safetyCheck.isSecure) {
      console.error(`❌ SECURITY ERROR: Insecure form defaults detected in ${formName}:`)
      safetyCheck.warnings.forEach(warning => console.error(`   ${warning}`))

      // In production, throw an error to prevent insecure defaults
      throw new Error(`Insecure form defaults detected in production for ${formName}`)
    }
  }

  return {
    isSecure: true,
    message: `Form defaults validated for ${formName}`
  }
}

/**
 * Creates secure form defaults based on environment
 * @param secureDefaults Always-safe defaults
 * @param developmentDefaults Development-only defaults (ignored in production)
 * @returns Appropriate defaults for current environment
 */
export function createSecureFormDefaults<T>(
  secureDefaults: T,
  developmentDefaults?: Partial<T>
): T {
  // Always use secure defaults in production
  if (isProduction()) {
    return secureDefaults
  }

  // In development, merge with development defaults if provided
  if (developmentDefaults) {
    return { ...secureDefaults, ...developmentDefaults }
  }

  return secureDefaults
}

/**
 * Sanitizes user input to remove potentially dangerous patterns
 * @param input User input
 * @returns Sanitized input
 */
export function sanitizeUserInput(input: string): string {
  if (typeof input !== 'string') return input

  // Remove common script injection patterns
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

/**
 * Validates password strength without exposing password content
 * @param password Password to validate
 * @returns Validation result without password content
 */
export function validatePasswordStrength(password: string) {
  const minLength = 8
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)

  const score = [
    password.length >= minLength,
    hasLowercase,
    hasUppercase,
    hasNumbers,
    hasSymbols
  ].filter(Boolean).length

  const strength = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong'

  return {
    isValid: score >= 3,
    strength,
    score,
    requirements: {
      minLength: password.length >= minLength,
      hasLowercase,
      hasUppercase,
      hasNumbers,
      hasSymbols
    }
  }
}

/**
 * Creates a secure placeholder for sensitive fields
 * @param fieldType Type of field
 * @returns Appropriate placeholder text
 */
export function getSecurePlaceholder(fieldType: 'password' | 'email' | 'name' | 'default'): string {
  switch (fieldType) {
    case 'password':
      return 'Enter a strong password'
    case 'email':
      return 'Enter your email address'
    case 'name':
      return 'Enter your full name'
    default:
      return 'Enter value'
  }
}

/**
 * Validates that email addresses don't use test/development patterns
 * @param email Email address to validate
 * @returns Validation result
 */
export function validateEmailSecurity(email: string) {
  const testPatterns = [
    '@test.com',
    '@example.com',
    '@localhost',
    'test@',
    'admin@test',
    'demo@',
    'sample@'
  ]

  const isTestEmail = testPatterns.some(pattern =>
    email.toLowerCase().includes(pattern.toLowerCase())
  )

  return {
    isSecure: !isTestEmail || !isProduction(),
    isTestEmail,
    message: isTestEmail && isProduction()
      ? 'Test email patterns not allowed in production'
      : 'Email validation passed'
  }
}