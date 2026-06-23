import { betterAuth } from "better-auth";
import { betterAuthAdapter } from "@/lib/auth/adapter";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_URL,
  database: betterAuthAdapter,
  emailAndPassword: {
    enabled: false,
    sendVerificationEmail: false,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      enabled: true,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    freshAge: 60 * 60 * 24,
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
      enabled: true,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
