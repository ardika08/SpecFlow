/**
 * Custom Drizzle Adapter untuk NextAuth.js dengan PostgreSQL/Neon
 *
 * Direct initialization - compatible with DrizzleAdapter
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Direct initialization - will throw if DATABASE_URL is not set
// In production (Vercel), env vars are loaded before runtime
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for PostgreSQL");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Export schema for NextAuth.js
export { schema };
