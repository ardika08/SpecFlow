/**
 * Script Migrasi: Hash password plaintext yang masih ada di database.
 *
 * Jalankan dengan: npx tsx scripts/migrate-passwords.ts
 *
 * Script ini akan:
 *  1. Scan tabel `users` untuk semua baris yang punya `password_hash`
 *  2. Deteksi apakah `password_hash` masih plaintext atau sudah bcrypt hash
 *  3. Hash password plaintext dengan bcrypt dan update di DB
 *  4. Skip baris yang sudah ada bcrypt hash-nya (idempotent)
 *
 * Aman dijalankan berulang-ulang (idempotent).
 */

import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import { isBcryptHash } from "../lib/auth/password";

const SALT_ROUNDS = 10;
const DB_PATH = "local.db";

function isPlaintext(value: string): boolean {
  // Bukan bcrypt hash = anggap plaintext (termasuk hash dari algoritma lain,
  // tapi untuk project ini password lama memang disimpan plaintext)
  return !isBcryptHash(value);
}

async function main() {
  console.log("=== Migrasi Password Plaintext -> Bcrypt ===\n");

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Ambil semua user yang punya password_hash
  const rows = db
    .prepare(
      "SELECT id, email, password_hash FROM users WHERE password_hash IS NOT NULL AND password_hash != ''"
    )
    .all() as { id: string; email: string; password_hash: string }[];

  console.log(`Ditemukan ${rows.length} user dengan password_hash.`);

  let hashed = 0;
  let skipped = 0;
  let failed = 0;

  const updateStmt = db.prepare(
    "UPDATE users SET password_hash = ?, updated_at = strftime('%s', 'now') WHERE id = ?"
  );

  for (const row of rows) {
    if (isBcryptHash(row.password_hash)) {
      console.log(`  [SKIP]  ${row.email} — sudah bcrypt hash`);
      skipped++;
      continue;
    }

    if (isPlaintext(row.password_hash)) {
      try {
        const hashedPassword = await bcrypt.hash(
          row.password_hash,
          SALT_ROUNDS
        );
        updateStmt.run(hashedPassword, row.id);
        console.log(`  [OK]    ${row.email} — berhasil di-hash`);
        hashed++;
      } catch (err) {
        console.error(
          `  [FAIL]  ${row.email} — ${(err as Error).message}`
        );
        failed++;
      }
    }
  }

  console.log("\n=== Ringkasan ===");
  console.log(`  Total diproses : ${rows.length}`);
  console.log(`  Di-hash       : ${hashed}`);
  console.log(`  Skip (sudah)  : ${skipped}`);
  console.log(`  Gagal         : ${failed}`);

  db.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
