/**
 * Custom Drizzle Adapter untuk Better Auth dengan PostgreSQL
 *
 * Masalah: Better Auth kirim timestamp sebagai integer (Unix timestamp),
 * tapi PostgreSQL butuh format ISO string atau Date object.
 *
 * Script ini wrap database calls dan convert timestamps secara otomatis.
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// Export schema untuk Better Auth
export { schema };

// Convert Unix timestamp (seconds) ke ISO string untuk PostgreSQL
function timestampToPostgres(value: number | Date | string | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return value;

  // Jika sudah Date object
  if (value instanceof Date) return value.toISOString();

  // Jika string, coba parse
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date.toISOString();
    return value;
  }

  // Jika number (Unix timestamp dalam seconds)
  if (typeof value === 'number') {
    // Cek apakah dalam miliseconds (JavaScript Date.getTime())
    // atau seconds (Unix timestamp)
    const timestamp = value > 1000000000000 ? value : value * 1000;
    return new Date(timestamp).toISOString();
  }

  return value as string;
}

// Function to convert all timestamps in an object
function convertTimestamps<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps) as unknown as T;
  }

  const result = { ...obj } as Record<string, unknown>;

  // Field timestamp yang perlu di-convert
  const timestampFields = [
    'createdAt', 'created_at',
    'updatedAt', 'updated_at',
    'currentPeriodEnd', 'current_period_end',
    'expiresAt', 'expires_at'
  ];

  for (const field of timestampFields) {
    // Cek dalam snake_case dan camelCase
    const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();

    if (result[snakeField] !== undefined) {
      result[snakeField] = timestampToPostgres(result[snakeField] as number | Date | string | null);
    }
    if (result[field] !== undefined) {
      result[field] = timestampToPostgres(result[field] as number | Date | string | null);
    }
  }

  return result as T;
}

export { db, convertTimestamps };
