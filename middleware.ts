import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Path yang dicocokkan persis (exact match).
 * Penting: "/" harus exact, kalau pakai startsWith semua path jadi public.
 */
const publicExactPaths = new Set<string>([
  "/",
  "/login",
  "/register",
]);

/**
 * Prefix path yang public (untuk subroute).
 * Catatan: route migrasi TIDAK ada di sini — sengaja diproteksi via secret di handler.
 */
const publicPrefixPaths = [
  "/api/auth/",          // semua endpoint Auth.js
  "/api/webhooks/",      // webhook eksternal (Mayar dll)
  "/api/debug-auth-config", // debug-only, tidak membocorkan secret
];

function isPublicPath(pathname: string): boolean {
  if (publicExactPaths.has(pathname)) return true;
  return publicPrefixPaths.some((prefix) => pathname.startsWith(prefix));
}

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // Skip middleware untuk file statis (mengandung titik di nama file)
  if (pathname.includes(".")) {
    return NextResponse.next();
  }

  // Izinkan path public
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Untuk route terproteksi, cek autentikasi
  if (!req.auth) {
    // Redirect ke login untuk halaman
    if (!pathname.startsWith("/api")) {
      const signInUrl = new URL("/login", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
    // 401 untuk API yang terproteksi
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
