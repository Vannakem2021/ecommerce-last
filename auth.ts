import { MongoDBAdapter } from "@auth/mongodb-adapter";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "./lib/db";
import client from "./lib/db/client";
import User from "./lib/db/models/user.model";

import NextAuth, { type DefaultSession } from "next-auth";
import authConfig from "./auth.config";
import { isSellerOrHigher } from "./lib/rbac-utils";

declare module "next-auth" {
  interface Session {
    user: {
      role: string;
    } & DefaultSession["user"];
  }
}

// Helper function to determine redirect URL based on user role
function getRoleBasedRedirectUrl(role: string, callbackUrl?: string): string {
  // If there's a specific callback URL, use it
  if (callbackUrl && callbackUrl !== "/") {
    return callbackUrl;
  }
  
  // Role-based default redirects
  if (isSellerOrHigher(role)) {
    return "/admin";
  }
  
  return "/"; // Regular users go to home page
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
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
              id: user._id,
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
    jwt: async ({ token, user, trigger, session }) => {
      // Handle new user sign-in
      if (user) {
        token.role = (user as { role: string }).role || "user";
        token.name = user.name || user.email!.split("@")[0];

        // For users without complete profile data, handle asynchronously
        if (!user.name) {
          // Don't block authentication - handle name update in background
          setImmediate(async () => {
            try {
              await connectToDatabase();
              const existingUser = await User.findById(user.id);
              const updatedName = user.email!.split("@")[0];

              if (existingUser) {
                await User.findByIdAndUpdate(user.id, { name: updatedName });
              } else {
                await User.findByIdAndUpdate(user.id, {
                  name: updatedName,
                  role: "user",
                });
              }
            } catch (error) {
              console.error("Background user update failed:", error);
            }
          });
        }
      }

      // Handle session updates
      if (session?.user?.name && trigger === "update") {
        token.name = session.user.name;
      }

      return token;
    },
    session: async ({ session, token }) => {
      // Ensure session has all required fields
      session.user.id = token.sub as string;
      session.user.role = token.role as string;
      session.user.name = token.name as string;
      
      // Add role-based redirect URL for client-side use
      (session as any).redirectUrl = getRoleBasedRedirectUrl(token.role as string);
      
      return session;
    },
  },
});
