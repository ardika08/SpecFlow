import { NextResponse } from "next/server";

/**
 * Debug endpoint untuk Auth.js v5 (next-auth).
 * Hanya menampilkan status keberadaan env (bukan nilainya) demi keamanan.
 */
export async function GET() {
  const expectedCallback = process.env.AUTH_URL || process.env.NEXTAUTH_URL;

  return NextResponse.json({
    // Auth.js v5 wajib: salah satu dari AUTH_SECRET / NEXTAUTH_SECRET
    hasAuthSecret: Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    // Auth.js v5 wajib di production: AUTH_URL / NEXTAUTH_URL
    authUrl: process.env.AUTH_URL || process.env.NEXTAUTH_URL || null,
    // Google OAuth
    hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
    hasGoogleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    googleClientIdPreview: process.env.GOOGLE_CLIENT_ID
      ? process.env.GOOGLE_CLIENT_ID.substring(0, 12) + "..."
      : null,
    // Database
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    // Redirect URI yang harus didaftarkan di Google Cloud Console
    expectedGoogleCallback: expectedCallback
      ? `${expectedCallback}/api/auth/callback/google`
      : "AUTH_URL belum diset",
    nodeEnv: process.env.NODE_ENV,
  });
}
