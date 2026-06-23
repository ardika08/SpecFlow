import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Public routes that don't require authentication
const publicPaths = [
  "/",
  "/login",
  "/register",
  "/api/auth",
  "/api/generate",
  "/api/projects",
  "/api/export",
  "/api/chat",
  "/api/webhooks",
  "/api/payment",
  "/api/notifications",
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(path));
}

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // Skip middleware for static files
  if (pathname.includes(".")) {
    return NextResponse.next();
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, check if user is authenticated
  if (!req.auth) {
    // Redirect to login for protected pages
    if (!pathname.startsWith("/api")) {
      const signInUrl = new URL("/login", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
    // Return 401 for protected API routes
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
