/**
 * Database Connection
 * Supports SQLite (default) and PostgreSQL (via DATABASE_URL)
 * Lazy initialization - connection only created when needed
 */

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */

import * as schema from "./schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// Database provider type
type DatabaseProvider = "sqlite" | "postgresql";

const provider = (process.env.DATABASE_PROVIDER ||
  (process.env.DATABASE_URL?.startsWith("postgres") ? "postgresql" : "sqlite")) as DatabaseProvider;

// Generic database type
type Database = NodePgDatabase<typeof schema> | ReturnType<typeof import("drizzle-orm/better-sqlite3").drizzle<typeof schema>>;

let dbInstance: Database | null = null;

/**
 * Initialize SQLite database
 */
function initSQLite() {
  const Database = require("better-sqlite3");
  const { readFileSync } = require("fs");
  const { join } = require("path");

  const sqlite = new Database("local.db");
  sqlite.pragma("journal_mode = WAL");

  // Run migrations if file exists
  try {
    const migrateSQL = readFileSync(join(process.cwd(), "lib/db/migrate.sql"), "utf-8");
    sqlite.exec(migrateSQL);
  } catch (error) {
    // migrate.sql might not exist in production
    console.log("No migrate.sql found, skipping migrations");
  }

  const { drizzle: drizzleSQLite } = require("drizzle-orm/better-sqlite3");
  return drizzleSQLite(sqlite, { schema });
}

/**
 * Initialize PostgreSQL database
 */
function initPostgreSQL() {
  const { neon } = require("@neondatabase/serverless");
  const { drizzle: drizzleNeon } = require("drizzle-orm/neon-http");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for PostgreSQL");
  }

  const sql = neon(connectionString);
  return drizzleNeon(sql, { schema });
}

/**
 * Get database instance (lazy initialization)
 */
function getDb(): Database {
  if (!dbInstance) {
    if (provider === "postgresql") {
      dbInstance = initPostgreSQL();
      console.log("Using PostgreSQL database");
    } else {
      dbInstance = initSQLite();
      console.log("Using SQLite database");
    }
  }
  return dbInstance;
}

// Export proxy to db for lazy access
export const db = new Proxy({} as any, {
  get(target, prop) {
    return getDb()[prop];
  },
});

export { schema, provider };
export * from "./schema";
