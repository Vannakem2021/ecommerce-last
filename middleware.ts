import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

import NextAuth from 'next-auth'
import authConfig from './auth.config'

const publicPages = [
  '/',
  '/search',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
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
  const publicPathnameRegex = RegExp(
    `^(/(${routing.locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  )
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname)

  if (isPublicPage) {
    return intlMiddleware(req)
  } else {
    if (!req.auth) {
      const newUrl = new URL(
        `/sign-in?callbackUrl=${
          encodeURIComponent(req.nextUrl.pathname) || '/'
        }`,
        req.nextUrl.origin
      )
      return Response.redirect(newUrl)
    } else {
      // Check permissions for admin routes - simplified check for edge runtime compatibility
      if (req.nextUrl.pathname.includes('/admin')) {
        const userRole = req.auth.user?.role
        // Allow admin, manager, and seller roles to access admin area
        const allowedRoles = ['admin', 'manager', 'seller']
        if (!userRole || !allowedRoles.includes(userRole.toLowerCase())) {
          const newUrl = new URL('/unauthorized', req.nextUrl.origin)
          return Response.redirect(newUrl)
        }
      }

      return intlMiddleware(req)
    }
  }
})

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
