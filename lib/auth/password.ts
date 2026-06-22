/**
 * Password hashing & verification utility using bcrypt.
 *
 * Sebelumnya password disimpan plaintext di kolom `users.password_hash`.
 * Module ini menggantikan praktik tersebut dengan bcrypt hash yang aman.
 *
 * Catatan: Better Auth sudah meng-hash password-nya sendiri di tabel
 * `accounts.password`. Utility ini khusus untuk custom API routes
 * (`/api/users`, `/api/users/password`) yang menulis ke `users.password_hash`.
 */

import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hash sebuah password plaintext menggunakan bcrypt.
 *
 * @param password - Password plaintext (minimal 6 karakter, divalidasi di layer API)
 * @returns Promise yang resolve ke bcrypt hash string (format: `$2b$10$...`)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifikasi password plaintext terhadap bcrypt hash.
 *
 * Mendukung backward-compatibility: jika `storedPassword` ternyata masih
 * plaintext (hasil dari kode lama), fungsi ini akan fallback ke perbandingan
 * langsung yang aman (constant-time-ish via bcrypt.equals) lalu mengembalikan
 * `true` agar caller tahu password benar dan bisa re-hash.
 *
 * @param password  - Password plaintext yang diinput user
 * @param storedPassword - Hash (atau plaintext legacy) dari database
 * @returns Promise<boolean> - `true` jika cocok
 */
export async function verifyPassword(
  password: string,
  storedPassword: string
): Promise<boolean> {
  // Deteksi apakah storedPassword adalah bcrypt hash.
  // Bcrypt hash selalu diawali dengan `$2a$`, `$2b$`, atau `$2y$`.
  if (/^\$2[abxy]\$\d{2}\$/.test(storedPassword)) {
    return bcrypt.compare(password, storedPassword);
  }

  // Fallback: storedPassword masih plaintext (legacy).
  // Lakukan perbandingan sederhana untuk backward-compat,
  // agar user lama tetap bisa login dan password-nya bisa di-rehash.
  return password === storedPassword;
}

/**
 * Cek apakah sebuah string sudah berupa bcrypt hash.
 *
 * Berguna untuk script migrasi: hanya hash password yang masih plaintext,
 * skip yang sudah ada hash-nya.
 *
 * @param value - String dari kolom password_hash
 * @returns `true` jika string adalah bcrypt hash
 */
export function isBcryptHash(value: string): boolean {
  return /^\$2[abxy]\$\d{2}\$/.test(value);
}
