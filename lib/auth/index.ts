import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

const dbProvider = process.env.DATABASE_PROVIDER ||
  (process.env.DATABASE_URL?.startsWith("postgres") ? "pg" : "sqlite");

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: dbProvider as "sqlite" | "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignUp: true,
    sendVerificationEmail: false,
    minPasswordLength: 6,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAgeOnExceeds: 60 * 60 * 24,
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_URL,
  ].filter(Boolean) as string[],
  user: {
    additionalFields: {
      tier: {
        type: "string",
        required: false,
        defaultValue: "Freemium",
      },
      phone: {
        type: "string",
        required: false,
      },
      currentPeriodEnd: {
        type: "date",
        required: false,
        defaultValue: null,
      },
    },
  },
  account: {
    accountLinking: {
      enabled: false,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
