/**
 * Custom Drizzle Adapter untuk NextAuth.js dengan PostgreSQL/Neon
 *
 * Lazy initialization - database connection hanya dibuat saat dibutuhkan
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

// Export lazy-initialized db
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = new Proxy({} as any, {
  get(target, prop) {
    // @ts-expect-error - dynamic access to db methods
    return getDb()[prop];
  },
});

// Export schema for NextAuth.js
export { schema };
