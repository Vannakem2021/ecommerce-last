# Environment Variables Documentation

This document provides comprehensive information about all environment variables required and optional for the e-commerce application.

## Overview

The application uses environment variables for configuration, secrets management, and feature toggles. Variables are validated at startup to ensure proper configuration and security.

## Required Environment Variables

These variables are essential for the application to function properly:

### Database Configuration
- **`MONGODB_URI`** - MongoDB connection string
  - **Format:** `mongodb+srv://username:password@cluster.mongodb.net/database`
  - **Required:** Always
  - **Security:** Must not use localhost in production

### Authentication & Security
- **`NEXTAUTH_SECRET`** - Secret key for NextAuth.js JWT signing
  - **Format:** Random string (min 32 characters)
  - **Required:** Always
  - **Security:** Must be cryptographically secure, never commit to version control
  - **Generation:** Use `openssl rand -base64 32`

- **`NEXTAUTH_URL`** - Canonical URL of the application
  - **Format:** `https://yourdomain.com` or `http://localhost:3000` (development only)
  - **Required:** Always
  - **Examples:**
    - Production: `https://mystore.com`
    - Development: `http://localhost:3000`

## OAuth Provider Configuration

### Google OAuth (Required for OAuth login)
- **`GOOGLE_CLIENT_ID`** - Google OAuth client ID
  - **Format:** String ending in `.apps.googleusercontent.com`
  - **Required:** Production (recommended for development)
  - **Obtained:** Google Cloud Console

- **`GOOGLE_CLIENT_SECRET`** - Google OAuth client secret
  - **Format:** Alphanumeric string
  - **Required:** Production (recommended for development)
  - **Security:** Keep confidential, never expose to client-side code

## Payment Provider Configuration (Optional)

### ABA PayWay Integration
- **`PAYWAY_MERCHANT_ID`** - ABA PayWay merchant identifier
  - **Required:** Only if payment processing is enabled
  - **Format:** Alphanumeric string provided by ABA PayWay

- **`PAYWAY_SECRET_KEY`** - ABA PayWay API secret key
  - **Required:** Only if payment processing is enabled
  - **Security:** Keep confidential, used for HMAC signature generation

- **`PAYWAY_BASE_URL`** - ABA PayWay API endpoint
  - **Default:** `https://checkout-sandbox.payway.com.kh` (sandbox)
  - **Production:** `https://checkout.payway.com.kh`
  - **Format:** Full URL with protocol

- **`PAYWAY_ENABLED`** - Enable/disable payment processing
  - **Values:** `true` | `false`
  - **Default:** `false`
  - **Note:** If enabled, merchant ID and secret key are required

## Email Service Configuration (Optional)

### Resend Email Service
- **`RESEND_API_KEY`** - Resend service API key
  - **Format:** String starting with `re_`
  - **Required:** For email functionality (order confirmations, password resets)
  - **Obtained:** Resend.com dashboard

- **`SENDER_NAME`** - Display name for outgoing emails
  - **Default:** `BCS Support`
  - **Format:** Human-readable name
  - **Example:** `My Store Support`

- **`SENDER_EMAIL`** - Sender email address for outgoing emails
  - **Default:** `onboarding@resend.dev`
  - **Format:** Valid email address
  - **Security:** Avoid using default addresses in production
  - **Example:** `noreply@mystore.com`

## Application Configuration

### Server Configuration
- **`NEXT_PUBLIC_SERVER_URL`** - Public URL for the application
  - **Format:** Full URL with protocol
  - **Used:** Client-side redirects, OAuth callbacks, email links
  - **Examples:**
    - Production: `https://mystore.com`
    - Development: `http://localhost:3000`

- **`NODE_ENV`** - Application environment
  - **Values:** `development` | `production` | `test`
  - **Default:** `production` (for security)
  - **Note:** Automatically set by most deployment platforms

## Environment Files

### .env.local (Development)
Create a `.env.local` file in the project root for development:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mystore

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# OAuth (Development)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (Optional)
RESEND_API_KEY=re_your-resend-api-key
SENDER_NAME=My Store Support
SENDER_EMAIL=noreply@localhost

# Payment (Optional)
PAYWAY_ENABLED=false
# PAYWAY_MERCHANT_ID=your-merchant-id
# PAYWAY_SECRET_KEY=your-secret-key
# PAYWAY_BASE_URL=https://checkout-sandbox.payway.com.kh

# Application
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NODE_ENV=development
```

### Production Environment
For production deployments, ensure all required variables are set securely:

```bash
# Required
MONGODB_URI=mongodb+srv://prod-user:secure-password@prod-cluster.mongodb.net/production-db
NEXTAUTH_SECRET=highly-secure-random-string-at-least-32-chars
NEXTAUTH_URL=https://mystore.com
GOOGLE_CLIENT_ID=production-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=production-google-client-secret

# Recommended
RESEND_API_KEY=re_production-resend-api-key
SENDER_NAME=My Store
SENDER_EMAIL=noreply@mystore.com
NEXT_PUBLIC_SERVER_URL=https://mystore.com

# Optional (if payment enabled)
PAYWAY_ENABLED=true
PAYWAY_MERCHANT_ID=production-merchant-id
PAYWAY_SECRET_KEY=production-secret-key
PAYWAY_BASE_URL=https://checkout.payway.com.kh

# System
NODE_ENV=production
```

## Security Considerations

### General Security
- Never commit environment files to version control
- Use different credentials for development and production
- Rotate secrets regularly
- Use strong, randomly generated values for secrets
- Validate environment variables at startup

### Production Security
- Avoid test/demo patterns in production values
- Use HTTPS URLs for all external services
- Ensure MongoDB uses authentication and encryption
- Keep API keys confidential and limit their scope
- Monitor for credential leaks in logs

## Validation

The application automatically validates environment variables at startup:

- **Required variables**: Application will not start if missing
- **Format validation**: URLs, emails, and patterns are checked
- **Security checks**: Test/demo patterns are flagged in production
- **Service validation**: Optional services are validated if configured

## Troubleshooting

### Common Issues

1. **Missing Required Variables**
   - Error: `Missing required environment variables: MONGODB_URI`
   - Solution: Add the missing variables to your environment configuration

2. **Invalid MongoDB URI**
   - Error: `SECURITY ERROR: Invalid MongoDB URI format`
   - Solution: Ensure URI starts with `mongodb://` or `mongodb+srv://`

3. **Localhost in Production**
   - Error: `Production environment cannot use localhost`
   - Solution: Use production-appropriate URLs and connection strings

4. **OAuth Configuration**
   - Error: OAuth login not working
   - Solution: Verify Google OAuth credentials and callback URLs

5. **Email Not Sending**
   - Warning: `Email service not configured`
   - Solution: Add Resend API key or check email service configuration

### Debugging Environment Variables

Enable development logging to see detailed environment validation:

```javascript
// In development, the app will log:
// 🌍 Environment: DEVELOPMENT
// ✅ All required environment variables are set
// ⚠️  Missing optional environment variables: RESEND_API_KEY, SENDER_NAME
// ℹ️  Note: These may limit functionality but won't prevent startup
```

## Migration Guide

When updating environment variables:

1. **Add new variables** to your environment configuration
2. **Update documentation** in this file
3. **Test locally** with new configuration
4. **Deploy to staging** for integration testing
5. **Update production** environment variables
6. **Monitor application** startup and functionality

## Support

For environment variable configuration issues:
- Check the application logs for detailed error messages
- Verify all required variables are set
- Ensure production values don't contain test patterns
- Contact the development team for deployment-specific issues

---

**Last Updated:** 2025-01-27
**Version:** 1.0.0