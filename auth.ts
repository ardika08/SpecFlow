import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db/pg-adapter";
import { users, accounts, sessions, verification_tokens } from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Schema includes an extra `id` PK on sessions which differs from the
  // adapter's default shape; the adapter still queries by sessionToken at
  // runtime, so the structural cast here is safe.
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verification_tokens,
  } as never) as Adapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add user ID to session
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Allow sign in for all Google users
      return true;
    },
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  events: {
    async createUser({ user }) {
      console.log("New user created:", user.email);
      // Set default tier for new users
      const { db } = await import("@/lib/db/pg-adapter");
      const { schema } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      await db.update(schema.users)
        .set({ tier: "Freemium" })
        .where(eq(schema.users.id, user.id!));
    },
  },
  debug: process.env.NODE_ENV === "development",
});

// Types for session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
    };
  }
}
