import { betterAuth } from "better-auth";
import { betterAuthAdapter } from "@/lib/auth/adapter";

export const auth = betterAuth({
  database: betterAuthAdapter,
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
