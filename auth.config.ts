import type { NextAuthConfig } from 'next-auth'

// Notice this is only an object, not a full Auth.js instance
export default {
  providers: [],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt: async ({ token, user }: any) => {
      if (user) {
        token.role = user.role
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: async ({ session, token }: any) => {
      if (token.role) {
        session.user.role = token.role
      }
      return session
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authorized({ request, auth }: any) {
      const protectedPaths = [
        /\/checkout(\/.*)?/,
        /\/account(\/.*)?/,
        /\/admin(\/.*)?/,
      ]
      const { pathname } = request.nextUrl
      if (protectedPaths.some((p) => p.test(pathname))) return !!auth
      return true
    },
  },
} satisfies NextAuthConfig
