// Auth.js v5 (NextAuth) Client Hooks

// For server-side, use the auth function from @/auth
export { auth as getServerSession } from "@/auth";

// For client components
export { useSession, signIn, signOut } from "next-auth/react";
