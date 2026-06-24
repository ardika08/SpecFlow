// Auth.js v5 (NextAuth) Client Hooks
import { createAuthClient } from "next-auth/react";

// Auto-detect base URL
const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

// Auth client for backward compatibility
export const authClient = createAuthClient({
  baseURL,
});

// For server-side, use the auth function from @/auth
export { auth as getServerSession } from "@/auth";

// For client components
export { useSession, signIn, signOut } from "next-auth/react";
