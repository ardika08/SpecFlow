// Auth.js v5 (NextAuth) Client Hooks

// For server-side, use dynamic import to avoid client-side bundling
export async function getServerSession() {
  const { auth } = await import("@/auth");
  return auth();
}

// For client components
export { useSession, signIn, signOut } from "next-auth/react";
