import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectToDatabase } from "./lib/db";
import client from "./lib/db/client";
import User from "./lib/db/models/user.model";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";

import NextAuth, { type DefaultSession } from "next-auth";
import authConfig from "./auth.config";
import { getPostLoginRedirectUrl } from "./lib/auth-redirect";
import { i18n } from "./i18n-config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}



export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  pages: {
    signIn: "/sign-in",
    newUser: "/sign-up",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (reduced from 30 for security)
    updateAge: 60 * 60, // 1 hour (reduced from 24 hours for security)
  },
  adapter: MongoDBAdapter(client),
  providers: [
    Google({
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "user", // Default role for OAuth users
        };
      },
    }),
    CredentialsProvider({
      credentials: {
        email: {
          type: "email",
        },
        password: { type: "password" },
      },
      async authorize(credentials) {
        await connectToDatabase();
        if (credentials == null) return null;

        // Normalize email to lowercase for consistent lookup
        const normalizedEmail = credentials.email
          ?.toString()
          .toLowerCase()
          .trim();
        if (!normalizedEmail) return null;

        const user = await User.findOne({ email: normalizedEmail });

        if (user && user.password) {
          const isMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (isMatch) {
            return {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    redirect: async ({ url, baseUrl, request }) => {
      try {
        // Only allow same-origin redirects for security
        if (!url.startsWith("/") && !url.startsWith(baseUrl)) {
          return baseUrl;
        }

        // For OAuth flows, redirect to a locale-aware post-auth page that handles role-based redirects
        // This is necessary because the redirect callback doesn't have access to user session
        if (url.includes("/api/auth/callback/")) {
          // Detect locale from request URL or fallback to default
          let locale = i18n.defaultLocale;

          try {
            // Extract locale from referer or request headers if available
            const referer = request?.headers?.get?.('referer') || '';
            const localeMatch = referer.match(/\/([a-z]{2}-[A-Z]{2}|[a-z]{2})\//);

            if (localeMatch) {
              const detectedLocale = localeMatch[1];
              const validLocale = i18n.locales.find(l => l.code === detectedLocale);
              if (validLocale) {
                locale = validLocale.code;
              }
            }
          } catch (localeError) {
            console.warn("Failed to detect locale from request, using default:", localeError);
          }

          const localeAwarePath = `/${locale}/auth/post-signin`;
          console.log(`OAuth redirect: Redirecting to locale-aware path: ${localeAwarePath}`);
          return `${baseUrl}${localeAwarePath}`;
        }

        // For other redirects, ensure they're same-origin
        return url.startsWith("/") ? `${baseUrl}${url}` : url;
      } catch (error) {
        console.error("Redirect callback error:", error);
        // Fallback to default locale on error
        return `${baseUrl}/${i18n.defaultLocale}/auth/post-signin`;
      }
    },
    signIn: async ({ user, account, profile }) => {
      try {
        await connectToDatabase();

        if (account?.provider === "google") {
          // Check if user already exists with this email
          const existingUser = await User.findOne({ email: user.email });

          if (existingUser) {
            // Preserve existing role and user data for OAuth account linking
            user.role = existingUser.role;
            user.name = existingUser.name || user.name;

            // Update last login timestamp
            await User.findByIdAndUpdate(existingUser._id, {
              lastLoginAt: new Date()
            });
          } else {
            // New OAuth user - set default role
            user.role = "user";
          }
        } else {
          // For credentials provider, update last login
          const existingUser = await User.findOne({ email: user.email });
          if (existingUser) {
            await User.findByIdAndUpdate(existingUser._id, {
              lastLoginAt: new Date()
            });
          }
        }
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
    jwt: async ({ token, user, trigger, session }) => {
      // Normalize token.sub to string as safeguard
      if (token.sub) {
        token.sub = String(token.sub);
      }

      // Handle new user sign-in
      if (user) {
        token.role = (user as { role: string }).role || "user";
        token.name = user.name || user.email!.split("@")[0];
      }

      // Query database for role if missing (edge case handling)
      if (!token.role && token.sub) {
        try {
          await connectToDatabase();
          const dbUser = await User.findById(token.sub);
          if (dbUser) {
            token.role = dbUser.role;
            token.name = dbUser.name || token.name;
          }
        } catch (error) {
          console.error("JWT callback database query failed:", error);
          token.role = "user"; // Fallback to user role
        }
      }

      // Handle session updates
      if (session?.user?.name && trigger === "update") {
        token.name = session.user.name;
      }

      return token;
    },
    session: async ({ session, token }) => {
      try {
        // Ensure session has all required fields
        session.user.id = token.sub as string;
        session.user.role = (token.role as string) || "user";
        session.user.name = (token.name as string) || session.user.email?.split("@")[0] || "";

        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        // Return session with fallback values
        session.user.role = "user";
        return session;
      }
    },
  },
});
