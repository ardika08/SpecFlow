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
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    return getDb()[prop as keyof typeof getDb()];
  },
});

// Export schema for NextAuth.js
export { schema };
