import { MongoDBAdapter } from '@auth/mongodb-adapter'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectToDatabase } from './lib/db'
import client from './lib/db/client'
import User from './lib/db/models/user.model'

import NextAuth, { type DefaultSession } from 'next-auth'
import authConfig from './auth.config'

declare module 'next-auth' {
  interface Session {
    user: {
      role: string
    } & DefaultSession['user']
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  pages: {
    signIn: '/sign-in',
    newUser: '/sign-up',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  adapter: MongoDBAdapter(client),
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'user', // Default role for OAuth users
        }
      },
    }),
    CredentialsProvider({
      credentials: {
        email: {
          type: 'email',
        },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        await connectToDatabase()
        if (credentials == null) return null

        // Normalize email to lowercase for consistent lookup
        const normalizedEmail = credentials.email?.toString().toLowerCase().trim()
        if (!normalizedEmail) return null

        const user = await User.findOne({ email: normalizedEmail })

        if (user && user.password) {
          const isMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          )
          if (isMatch) {
            return {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
            }
          }
        }
        return null
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        // For new users or users without complete profile data
        if (!user.name) {
          await connectToDatabase()
          // Get the current user from database to preserve existing role
          const existingUser = await User.findById(user.id)
          const updatedName = user.name || user.email!.split('@')[0]

          if (existingUser) {
            // Update only the name, preserve existing role
            await User.findByIdAndUpdate(user.id, {
              name: updatedName,
              // Don't override existing role
            })
            token.name = updatedName
            token.role = existingUser.role // Use existing role from database
          } else {
            // New user case - set default role
            await User.findByIdAndUpdate(user.id, {
              name: updatedName,
              role: 'user',
            })
            token.name = updatedName
            token.role = 'user'
          }
        } else {
          // User has complete data, use it directly
          token.name = user.name
          token.role = (user as { role: string }).role
        }
      }

      if (session?.user?.name && trigger === 'update') {
        token.name = session.user.name
      }

      // Ensure role consistency for existing tokens
      // This helps resolve any role mismatches from previous sessions
      if (token.sub && !user) {
        try {
          await connectToDatabase()
          const currentUser = await User.findById(token.sub)
          if (currentUser && currentUser.role !== token.role) {
            // Update token with current database role
            token.role = currentUser.role
          }
        } catch (error) {
          // Log error but don't break authentication
          console.error('Error syncing user role:', error)
        }
      }

      return token
    },
    session: async ({ session, user, trigger, token }) => {
      session.user.id = token.sub as string
      session.user.role = token.role as string
      session.user.name = token.name
      if (trigger === 'update') {
        session.user.name = user.name
      }
      return session
    },
  },
})
