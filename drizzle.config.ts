import type { Config } from "drizzle-kit";

const provider = process.env.DATABASE_PROVIDER ||
  (process.env.DATABASE_URL?.startsWith("postgres") ? "postgresql" : "sqlite");

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: provider === "postgresql" ? "postgresql" : "sqlite",
  ...(provider === "postgresql" ? {
    driver: "pg",
    dbCredentials: {
      connectionString: process.env.DATABASE_URL || "",
    },
  } : {
    driver: "better-sqlite",
  }),
} satisfies Config;
