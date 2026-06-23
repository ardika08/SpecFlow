/**
 * Custom Better Auth Drizzle Adapter untuk PostgreSQL
 *
 * Better Auth drizzle adapter configuration dengan timestamp conversion.
 */

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "@/lib/db/pg-adapter";

export const betterAuthAdapter = drizzleAdapter(db, {
  provider: "pg",
  schema: {
    user: schema.users,
    session: schema.sessions,
    account: schema.accounts,
    verification: schema.verification,
  },
});
