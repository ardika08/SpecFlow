/**
 * Custom Drizzle Adapter untuk NextAuth.js dengan PostgreSQL/Neon
 *
 * Lazy initialization - database connection hanya dibuat saat dibutuhkan
 * Compatible with DrizzleAdapter
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!dbInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for PostgreSQL");
    }
    const sql = neon(process.env.DATABASE_URL);
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}

// Export a function to get db (for DrizzleAdapter compatibility)
export function getDrizzleDb() {
  return getDb();
}

// For backward compatibility, also export db as a direct getter
// This will be evaluated on first import
export const db = getDb();

// Export schema for NextAuth.js
export { schema };
