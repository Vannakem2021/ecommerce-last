/**
 * Startup configuration validator
 * Performs comprehensive validation of environment variables and system configuration
 */

import {
  validateRequiredEnvironmentVariables,
  validatePaymentProviderConfig,
  validateEmailServiceConfig,
  logEnvironmentStatus,
  isProduction,
  isDevelopment,
  getEnvironment
} from './environment'

/**
 * Helper function to safely get environment variable in Edge Runtime
 */
function getEnvVar(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key]
  }
  return undefined
}

export interface StartupValidationResult {
  success: boolean
  errors: string[]
  warnings: string[]
  info: string[]
  environment: string
  services: {
    database: boolean
    authentication: boolean
    payment: boolean
    email: boolean
  }
}

/**
 * Comprehensive startup validation
 * Validates all critical configuration and services
 * @param options Validation options
 */
export async function validateStartupConfiguration(options: {
  throwOnFailure?: boolean
  logResults?: boolean
} = {}): Promise<StartupValidationResult> {
  const { throwOnFailure = false, logResults = true } = options

  const result: StartupValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    info: [],
    environment: getEnvironment(),
    services: {
      database: false,
      authentication: false,
      payment: false,
      email: false
    }
  }

  if (logResults) {
    console.log('🚀 Starting application configuration validation...')
    console.log('=' .repeat(60))
  }

  try {
    // 1. Validate environment variables
    if (logResults) console.log('📋 Validating environment variables...')

    try {
      const envValidation = validateRequiredEnvironmentVariables(false)
      result.services.database = true
      result.services.authentication = true

      if (logResults) {
        logEnvironmentStatus()
      }

      if (envValidation.warnings.length > 0) {
        result.warnings.push(...envValidation.warnings.map(w => `Environment: ${w}`))
      }

      if (envValidation.optional && envValidation.optional.length > 0) {
        result.info.push(`Optional variables missing: ${envValidation.optional.join(', ')}`)
      }

    } catch (error) {
      result.success = false
      result.errors.push(`Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      result.services.database = false
      result.services.authentication = false
    }

    // 2. Validate payment provider configuration
    if (logResults) console.log('💳 Validating payment provider configuration...')

    const paymentConfig = validatePaymentProviderConfig()
    if (paymentConfig.isEnabled) {
      if (paymentConfig.canProcess) {
        result.services.payment = true
        result.info.push('Payment processing is enabled and configured')
      } else {
        result.warnings.push(paymentConfig.warning || 'Payment processing enabled but not fully configured')
      }
    } else {
      result.info.push('Payment processing is disabled')
    }

    // 3. Validate email service configuration
    if (logResults) console.log('📧 Validating email service configuration...')

    const emailConfig = validateEmailServiceConfig()
    if (emailConfig.hasApiKey) {
      if (emailConfig.canSendEmail) {
        result.services.email = true
        result.info.push('Email service is configured and ready')
      } else {
        result.warnings.push(emailConfig.warning || 'Email API configured but sender information missing')
      }
    } else {
      result.warnings.push('Email service not configured - email functionality will be limited')
    }

    // 4. Production-specific validations
    if (isProduction()) {
      if (logResults) console.log('🔒 Running production-specific validations...')

      // Check for development patterns in production
      const productionChecks = [
        {
          key: 'NEXTAUTH_URL',
          value: getEnvVar('NEXTAUTH_URL'),
          patterns: ['localhost', '127.0.0.1'],
          message: 'NEXTAUTH_URL contains localhost in production'
        },
        {
          key: 'MONGODB_URI',
          value: getEnvVar('MONGODB_URI'),
          patterns: ['localhost', '127.0.0.1', 'test', 'demo'],
          message: 'MONGODB_URI contains development patterns in production'
        }
      ]

      productionChecks.forEach(check => {
        if (check.value && check.patterns.some(pattern =>
          check.value!.toLowerCase().includes(pattern)
        )) {
          if (check.patterns.some(p => ['localhost', '127.0.0.1'].includes(p))) {
            result.errors.push(check.message)
            result.success = false
          } else {
            result.warnings.push(check.message)
          }
        }
      })
    }

    // 5. Development-specific validations
    if (isDevelopment()) {
      if (logResults) console.log('🛠️  Running development-specific validations...')

      // Check for missing development tools
      if (!getEnvVar('GOOGLE_CLIENT_ID') || !getEnvVar('GOOGLE_CLIENT_SECRET')) {
        result.warnings.push('OAuth credentials missing - social login will not work')
      }
    }

    // 6. Service connectivity checks (basic validation)
    if (logResults) console.log('🔍 Running basic service checks...')

    // MongoDB URI format validation
    const mongoUri = getEnvVar('MONGODB_URI')
    if (mongoUri) {
      if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
        result.errors.push('Invalid MongoDB URI format')
        result.success = false
        result.services.database = false
      }
    }

    // Final validation
    const criticalServices = ['database', 'authentication'] as const
    const missingCriticalServices = criticalServices.filter(service => !result.services[service])

    if (missingCriticalServices.length > 0) {
      result.success = false
      result.errors.push(`Critical services not configured: ${missingCriticalServices.join(', ')}`)
    }

  } catch (error) {
    result.success = false
    result.errors.push(`Startup validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Log results
  if (logResults) {
    console.log('=' .repeat(60))
    logValidationResults(result)
  }

  // Handle failure
  if (!result.success && throwOnFailure) {
    console.error('❌ CRITICAL: Startup validation failed. Application cannot continue.')
    throw new Error(`Startup validation failed: ${result.errors.join(', ')}`)
  }

  return result
}

/**
 * Quick startup validation for critical services only
 * Use this for fast validation without detailed logging
 */
export function validateCriticalConfiguration(): boolean {
  try {
    // In browser environments, just return true to avoid blocking
    if (typeof window !== 'undefined') {
      return true
    }

    // Helper function to safely get environment variable
    const getEnvVar = (key: string): string | undefined => {
      try {
        if (typeof process !== 'undefined' && process.env) {
          return process.env[key]
        }
      } catch (error) {
        // In Edge Runtime or other constrained environments, process might not be accessible
        return undefined
      }
      return undefined
    }

    // Check only the most critical environment variables
    const critical = ['MONGODB_URI', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']
    const missing = critical.filter(key => !getEnvVar(key))

    if (missing.length > 0) {
      // In development, be more permissive
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.info(`ℹ️  Some environment variables are missing: ${missing.join(', ')}`)
        console.info('This is normal in development - functionality may be limited')
        return true
      }

      console.warn(`⚠️  Critical environment variables missing: ${missing.join(', ')}`)
      // Still return true to avoid blocking - let the app handle missing variables gracefully
      return true
    }

    // Basic format validation
    const mongoUri = getEnvVar('MONGODB_URI')
    if (mongoUri && (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://'))) {
      console.warn('⚠️  Invalid MongoDB URI format - database operations may fail')
    }

    return true
  } catch (error) {
    console.warn('⚠️  Critical configuration validation encountered an error:', error)
    // Always return true to avoid blocking application startup
    return true
  }
}

/**
 * Log validation results in a formatted way
 */
function logValidationResults(result: StartupValidationResult) {
  // Success/Failure status
  if (result.success) {
    console.log('✅ Startup validation completed successfully')
  } else {
    console.log('❌ Startup validation failed')
  }

  // Environment info
  console.log(`🌍 Environment: ${result.environment.toUpperCase()}`)

  // Service status
  console.log('\n🔧 Service Status:')
  Object.entries(result.services).forEach(([service, status]) => {
    const icon = status ? '✅' : '❌'
    const name = service.charAt(0).toUpperCase() + service.slice(1)
    console.log(`   ${icon} ${name}`)
  })

  // Errors
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:')
    result.errors.forEach(error => console.log(`   • ${error}`))
  }

  // Warnings
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    result.warnings.forEach(warning => console.log(`   • ${warning}`))
  }

  // Info
  if (result.info.length > 0) {
    console.log('\nℹ️  Information:')
    result.info.forEach(info => console.log(`   • ${info}`))
  }

  console.log('') // Empty line for spacing
}

/**
 * Environment-specific startup validation
 */
export async function validateEnvironmentSpecificConfiguration() {
  if (isProduction()) {
    return validateProductionConfiguration()
  } else if (isDevelopment()) {
    return validateDevelopmentConfiguration()
  } else {
    return validateTestConfiguration()
  }
}

/**
 * Production-specific validation
 */
function validateProductionConfiguration() {
  console.log('🔒 Running production configuration validation...')

  const issues: string[] = []

  // Check for secure URLs
  const urls = [
    { key: 'NEXTAUTH_URL', value: getEnvVar('NEXTAUTH_URL') },
    { key: 'NEXT_PUBLIC_SERVER_URL', value: getEnvVar('NEXT_PUBLIC_SERVER_URL') }
  ]

  urls.forEach(({ key, value }) => {
    if (value && !value.startsWith('https://')) {
      issues.push(`${key} should use HTTPS in production`)
    }
  })

  // Check for development patterns
  const mongoUri = getEnvVar('MONGODB_URI')
  if (mongoUri?.includes('localhost')) {
    issues.push('MongoDB URI uses localhost in production')
  }

  if (issues.length > 0) {
    console.warn('⚠️  Production configuration issues:')
    issues.forEach(issue => console.warn(`   • ${issue}`))
  } else {
    console.log('✅ Production configuration looks good')
  }

  return issues
}

/**
 * Development-specific validation
 */
function validateDevelopmentConfiguration() {
  console.log('🛠️  Running development configuration validation...')

  const recommendations: string[] = []

  // Check for recommended development tools
  if (!getEnvVar('GOOGLE_CLIENT_ID')) {
    recommendations.push('Add GOOGLE_CLIENT_ID for OAuth testing')
  }

  if (!getEnvVar('RESEND_API_KEY')) {
    recommendations.push('Add RESEND_API_KEY for email testing')
  }

  if (recommendations.length > 0) {
    console.info('💡 Development recommendations:')
    recommendations.forEach(rec => console.info(`   • ${rec}`))
  } else {
    console.log('✅ Development configuration is complete')
  }

  return recommendations
}

/**
 * Test-specific validation
 */
function validateTestConfiguration() {
  console.log('🧪 Running test configuration validation...')

  // Test environment should have minimal requirements
  const testIssues: string[] = []

  if (!getEnvVar('MONGODB_URI')) {
    testIssues.push('MONGODB_URI required for database tests')
  }

  if (testIssues.length > 0) {
    console.warn('⚠️  Test configuration issues:')
    testIssues.forEach(issue => console.warn(`   • ${issue}`))
  } else {
    console.log('✅ Test configuration looks good')
  }

  return testIssues
}