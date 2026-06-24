/**
 * Database Connection (Postgres / neon-http)
 *
 * Hanya support Postgres karena produksi pakai Neon, dan dual SQLite/PG bikin
 * dua sumber kebenaran yang gampang drift. Untuk dev lokal, gunakan Neon
 * branch atau Postgres lokal lalu set DATABASE_URL.
 *
 * Re-export instance `db` yang sama dengan yang dipakai DrizzleAdapter di auth.ts
 * agar tidak ada dua koneksi paralel.
 */

export { db, schema } from "./pg-adapter";
export * from "./schema";

