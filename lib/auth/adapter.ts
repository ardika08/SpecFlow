/**
 * Custom Better Auth Drizzle Adapter untuk PostgreSQL
 *
 * Better Auth drizzle adapter configuration dengan timestamp conversion.
 */

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "@/lib/db/pg-adapter";

// Convert milliseconds to ISO string for PostgreSQL
function convertTimestamps(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(convertTimestamps);

  const result = { ...obj };
  const timestampFields = [
    "createdAt", "created_at",
    "updatedAt", "updated_at",
    "expiresAt", "expires_at",
    "currentPeriodEnd", "current_period_end",
  ];

  for (const field of timestampFields) {
    const snakeField = field.replace(/([A-Z])/g, "_$1").toLowerCase();

    if (result[snakeField] !== undefined && typeof result[snakeField] === "number") {
      // Convert milliseconds to ISO string
      result[snakeField] = new Date(result[snakeField]).toISOString();
    }
    if (result[field] !== undefined && typeof result[field] === "number") {
      result[field] = new Date(result[field]).toISOString();
    }
  }

  return result;
}

export const betterAuthAdapter = drizzleAdapter(db, {
  provider: "pg",
  schema: {
    user: schema.users,
    session: schema.sessions,
    account: schema.accounts,
    verification: schema.verification,
  },
});
