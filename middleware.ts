import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const publicPaths = ["/", "/login", "/register", "/api/auth/sign-in", "/api/auth/sign-up", "/api/generate", "/api/projects", "/api/export", "/api/chat"];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Skip middleware for static files and API routes that handle their own auth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") || // static files
    pathname.startsWith("/api/auth") || // auth API routes handle their own validation
    pathname.startsWith("/api/notifications") || // notifications check their own auth
    pathname.startsWith("/api/payment") || // payment webhooks
    pathname.startsWith("/api/webhooks") // webhooks
  ) {
    return NextResponse.next();
  }

  // For protected routes, we'll let the page/API route handle auth themselves
  // This avoids the edge runtime + better-sqlite3 incompatibility
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
