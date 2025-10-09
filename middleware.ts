import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

import NextAuth from 'next-auth'
import authConfig from './auth.config'
import { validateCriticalConfiguration } from './lib/utils/startup-validator'

// Validate critical configuration on middleware initialization
try {
  const isConfigValid = validateCriticalConfiguration()
  if (!isConfigValid) {
    console.warn('⚠️  WARNING: Some environment variables are missing - middleware will continue but functionality may be limited')
  }
} catch (error) {
  console.error('❌ ERROR: Environment validation failed in middleware:', error)
  console.warn('⚠️  Middleware will continue but some functionality may not work properly')
}

const publicPages = [
  '/',
  '/search',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/verify-email',
  '/reset-password/(.*)',
  '/cart',
  '/cart/(.*)',
  '/product/(.*)',
  '/page/(.*)',
  '/unauthorized',
]

const intlMiddleware = createMiddleware(routing)
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  // Improved regex to handle query parameters and hash fragments
  const publicPathnameRegex = RegExp(
    `^(/(${routing.locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})(/.*)?$`,
    'i'
  )

  // Extract pathname without query parameters for matching
  const pathname = req.nextUrl.pathname
  const isPublicPage = publicPathnameRegex.test(pathname)

  if (isPublicPage) {
    return intlMiddleware(req)
  } else {
    if (!req.auth) {
      // Validate callback URL to prevent open redirect attacks
      const callbackUrl = req.nextUrl.pathname + req.nextUrl.search
      const encodedCallback = encodeURIComponent(callbackUrl)

      // Ensure callback URL is relative and safe
      const safeCallback = callbackUrl.startsWith('/') ? encodedCallback : encodeURIComponent('/')

      const newUrl = new URL(
        `/sign-in?callbackUrl=${safeCallback}`,
        req.nextUrl.origin
      )
      return Response.redirect(newUrl)
    } else {
      return intlMiddleware(req)
    }
  }
})

export const config = {
  // Skip all paths that should not be internationalized
  // Exclude: api, _next, static files with extensions
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|manifest.json|icon.png|apple-icon.png).*)'
  ],
}
