/**
 * Environment detection and validation utilities
 * Provides secure environment checks without exposing sensitive data
 */

export type Environment = 'development' | 'production' | 'test'

/**
 * Checks if we're running in Edge Runtime
 * @returns True if in Edge Runtime environment
 */
export function isEdgeRuntime(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof (globalThis as any).EdgeRuntime !== 'undefined' || typeof process === 'undefined'
}

/**
 * Gets the current environment with proper validation
 * Works in both Node.js and Edge Runtime environments
 * @returns The current environment
 */
export function getEnvironment(): Environment {
  // Handle Edge Runtime environment
  if (isEdgeRuntime()) {
    // In Edge Runtime, check for environment variable differently
    const env = (typeof process !== 'undefined' ? process.env?.NODE_ENV : undefined)?.toLowerCase()
    return env === 'development' ? 'development' : env === 'test' ? 'test' : 'production'
  }

  // Standard Node.js environment
  const env = process.env.NODE_ENV?.toLowerCase()

  switch (env) {
    case 'development':
      return 'development'
    case 'production':
      return 'production'
    case 'test':
      return 'test'
    default:
      // Default to production for security if NODE_ENV is not set
      return 'production'
  }
}

/**
 * Checks if the current environment is development
 * @returns True if in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development'
}

/**
 * Checks if the current environment is production
 * @returns True if in production mode
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production'
}

/**
 * Checks if the current environment is test
 * @returns True if in test mode
 */
export function isTest(): boolean {
  return getEnvironment() === 'test'
}

/**
 * Validates that critical environment variables are set
 * @returns Object with validation results and missing variables
 */
export function validateEnvironmentVariables() {
  // In Edge Runtime, some validations may not be available
  if (isEdgeRuntime()) {
    console.warn('⚠️  Running in Edge Runtime - limited environment validation available')
  }

  const required = [
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]

  const development = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ]

  const production = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ]

  // Payment provider variables (optional but recommended)
  const paymentProvider = [
    'PAYWAY_MERCHANT_ID',
    'PAYWAY_SECRET_KEY',
    'PAYWAY_BASE_URL',
    'PAYWAY_ENABLED'
  ]

  // Email service variables (optional but recommended)
  const emailService = [
    'RESEND_API_KEY',
    'SENDER_NAME',
    'SENDER_EMAIL'
  ]

  // Application configuration
  const appConfig = [
    'NEXT_PUBLIC_SERVER_URL',
    'NODE_ENV'
  ]

  const missing: string[] = []
  const warnings: string[] = []
  const optional: string[] = []

  // Helper function to safely get environment variable
  const getEnvVar = (key: string): string | undefined => {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key]
    }
    return undefined
  }

  // Check required variables for all environments
  required.forEach(variable => {
    if (!getEnvVar(variable)) {
      missing.push(variable)
    }
  })

  // Check environment-specific variables
  if (isProduction()) {
    production.forEach(variable => {
      if (!getEnvVar(variable)) {
        missing.push(variable)
      }
    })
  } else if (isDevelopment()) {
    development.forEach(variable => {
      if (!getEnvVar(variable)) {
        warnings.push(variable)
      }
    })
  }

  // Check optional payment provider variables
  paymentProvider.forEach(variable => {
    if (!getEnvVar(variable)) {
      optional.push(variable)
    }
  })

  // Check optional email service variables
  emailService.forEach(variable => {
    if (!getEnvVar(variable)) {
      optional.push(variable)
    }
  })

  // Check application configuration variables
  appConfig.forEach(variable => {
    if (!getEnvVar(variable)) {
      if (variable === 'NODE_ENV') {
        warnings.push(variable + ' (defaults to production)')
      } else {
        optional.push(variable)
      }
    }
  })

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    optional,
    environment: getEnvironment(),
    categories: {
      required,
      development,
      production,
      paymentProvider,
      emailService,
      appConfig
    }
  }
}

/**
 * Logs environment validation results (browser-safe)
 */
export function logEnvironmentStatus() {
  try {
    // Skip environment validation in browser environments
    if (typeof window !== 'undefined') {
      console.log('🌍 Environment: Browser (client-side)')
      console.info('ℹ️  Environment validation skipped in browser')
      return {
        isValid: true,
        missing: [],
        warnings: [],
        optional: [],
        environment: 'development' as Environment,
        categories: {
          required: [],
          development: [],
          production: [],
          paymentProvider: [],
          emailService: [],
          appConfig: []
        }
      }
    }

    const validation = validateEnvironmentVariables()
    const env = getEnvironment()

    console.log(`🌍 Environment: ${env.toUpperCase()}`)

    if (validation.isValid) {
      console.log('✅ All required environment variables are set')
    } else {
      console.warn('⚠️  Missing required environment variables:', validation.missing)
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️  Missing development environment variables:', validation.warnings)
    }

    if (validation.optional.length > 0) {
      console.info('ℹ️  Missing optional environment variables:', validation.optional)
      console.info('   Note: These may limit functionality but won\'t prevent startup')
    }

    // Log category summary
    console.log('\n📊 Environment Variable Categories:')
    console.log(`   Required: ${validation.categories.required.length}`)
    console.log(`   OAuth/Auth: ${validation.categories.production.length}`)
    console.log(`   Payment: ${validation.categories.paymentProvider.length}`)
    console.log(`   Email: ${validation.categories.emailService.length}`)
    console.log(`   Config: ${validation.categories.appConfig.length}`)

    return validation
  } catch (error) {
    console.warn('⚠️  Environment status logging failed:', error)
    return {
      isValid: true,
      missing: [],
      warnings: [],
      optional: [],
      environment: 'development' as Environment,
      categories: {
        required: [],
        development: [],
        production: [],
        paymentProvider: [],
        emailService: [],
        appConfig: []
      }
    }
  }
}

/**
 * Security check: Ensures no development data is used in production
 * @param data Any data that might contain development defaults
 * @param context Description of what data is being checked
 */
export function validateProductionSafety(data: any, context: string = 'data') {
  if (!isProduction()) {
    return { isSecure: true, warnings: [] }
  }

  const warnings: string[] = []
  const developmentPatterns = [
    'sample',
    'test',
    'demo',
    'example',
    'placeholder',
    'localhost',
    '127.0.0.1',
    'admin@example.com',
    'test@test.com',
    '123456',
    'password',
    'changeme'
  ]

  const checkValue = (value: any, path: string = '') => {
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase()
      developmentPatterns.forEach(pattern => {
        if (lowerValue.includes(pattern)) {
          warnings.push(`Development pattern "${pattern}" found in ${context}${path}: ${value}`)
        }
      })
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([key, val]) => {
        checkValue(val, `${path}.${key}`)
      })
    }
  }

  checkValue(data)

  return {
    isSecure: warnings.length === 0,
    warnings
  }
}

/**
 * Gets safe environment information for client-side use
 * @returns Environment info without sensitive data
 */
export function getClientEnvironmentInfo() {
  return {
    environment: getEnvironment(),
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    isTest: isTest(),
    timestamp: new Date().toISOString()
  }
}

/**
 * Validates critical environment variables and throws on failure
 * Use this for startup validation where the app cannot continue without required variables
 * @param throwOnFailure Whether to throw an error on validation failure (default: true)
 */
export function validateRequiredEnvironmentVariables(throwOnFailure: boolean = true) {
  try {
    // Skip validation in browser environments
    if (typeof window !== 'undefined') {
      return {
        isValid: true,
        missing: [],
        warnings: [],
        optional: [],
        environment: 'development' as Environment,
        categories: {
          required: [],
          development: [],
          production: [],
          paymentProvider: [],
          emailService: [],
          appConfig: []
        }
      }
    }

    const validation = validateEnvironmentVariables()

    if (!validation.isValid) {
      const errorMessage = `⚠️  Missing required environment variables: ${validation.missing.join(', ')}`
      console.warn(errorMessage)
      console.warn('Some functionality may be limited without these environment variables.')
      console.info('Please check your .env file or deployment configuration.')

      // In development, don't throw errors to avoid blocking the app
      if (throwOnFailure && isProduction()) {
        throw new Error(`Missing required environment variables: ${validation.missing.join(', ')}`)
      }
    }

    return validation
  } catch (error) {
    console.warn('⚠️  Environment validation encountered an error:', error)

    if (throwOnFailure && isProduction()) {
      throw error
    }

    // Return a safe default in development
    return {
      isValid: false,
      missing: [],
      warnings: [],
      optional: [],
      environment: getEnvironment(),
      categories: {
        required: [],
        development: [],
        production: [],
        paymentProvider: [],
        emailService: [],
        appConfig: []
      }
    }
  }
}

/**
 * Gets a secure environment variable with validation
 * @param key Environment variable key
 * @param required Whether the variable is required (throws if missing)
 * @param defaultValue Default value if not required and missing
 * @returns The environment variable value
 */
export function getSecureEnvVar(key: string, required: boolean = true, defaultValue?: string): string {
  const value = (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined

  if (!value) {
    if (required) {
      throw new Error(`Required environment variable ${key} is not set`)
    }
    return defaultValue || ''
  }

  // Security check: Don't allow obvious test/development values in production
  if (isProduction()) {
    const testPatterns = ['test', 'demo', 'example', 'placeholder', 'changeme', '123456']
    const lowerValue = value.toLowerCase()

    if (testPatterns.some(pattern => lowerValue.includes(pattern))) {
      console.error(`⚠️  WARNING: Environment variable ${key} contains test/development patterns in production`)
      if (required) {
        throw new Error(`Environment variable ${key} contains unsafe test patterns in production`)
      }
    }
  }

  return value
}

/**
 * Validates payment provider configuration
 * @returns Payment provider validation result
 */
export function validatePaymentProviderConfig() {
  const paymentVars = ['PAYWAY_MERCHANT_ID', 'PAYWAY_SECRET_KEY', 'PAYWAY_BASE_URL', 'PAYWAY_ENABLED']
  const missing: string[] = []
  const present: string[] = []

  // Helper function to safely get environment variable
  const getEnvVar = (key: string): string | undefined => {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key]
    }
    return undefined
  }

  paymentVars.forEach(variable => {
    if (getEnvVar(variable)) {
      present.push(variable)
    } else {
      missing.push(variable)
    }
  })

  const isEnabled = getEnvVar('PAYWAY_ENABLED') === 'true'
  const hasRequiredVars = present.includes('PAYWAY_MERCHANT_ID') && present.includes('PAYWAY_SECRET_KEY')

  return {
    isEnabled,
    hasRequiredVars,
    canProcess: isEnabled && hasRequiredVars,
    missing,
    present,
    warning: isEnabled && !hasRequiredVars ? 'Payment processing is enabled but required credentials are missing' : null
  }
}

/**
 * Validates email service configuration
 * @returns Email service validation result
 */
export function validateEmailServiceConfig() {
  const emailVars = ['RESEND_API_KEY', 'SENDER_NAME', 'SENDER_EMAIL']
  const missing: string[] = []
  const present: string[] = []

  // Helper function to safely get environment variable
  const getEnvVar = (key: string): string | undefined => {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key]
    }
    return undefined
  }

  emailVars.forEach(variable => {
    const value = getEnvVar(variable)
    if (value) {
      present.push(variable)
    } else {
      // Check if we have reasonable defaults for sender info
      if (variable === 'SENDER_NAME' || variable === 'SENDER_EMAIL') {
        // These have defaults, so consider them as present but note they're defaults
        present.push(variable)
      } else {
        missing.push(variable)
      }
    }
  })

  const hasApiKey = present.includes('RESEND_API_KEY')
  const hasSenderInfo = present.includes('SENDER_NAME') && present.includes('SENDER_EMAIL')

  // Check if using default values instead of missing values
  const hasCustomSenderEmail = getEnvVar('SENDER_EMAIL') && getEnvVar('SENDER_EMAIL') !== 'onboarding@resend.dev'
  const hasCustomSenderName = getEnvVar('SENDER_NAME') && getEnvVar('SENDER_NAME') !== 'BCS Support'

  let warning: string | null = null
  if (hasApiKey && !hasSenderInfo) {
    warning = 'Email API key present but custom sender information not configured (using defaults)'
  } else if (hasApiKey && hasSenderInfo && (!hasCustomSenderEmail || !hasCustomSenderName)) {
    warning = null // Don't warn when using reasonable defaults
  }

  return {
    hasApiKey,
    hasSenderInfo,
    canSendEmail: hasApiKey, // Can send email even with default sender info
    missing,
    present,
    warning
  }
}