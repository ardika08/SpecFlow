// Auth.js v5 (NextAuth) Client Hooks
// For client-side session management, use the SessionProvider pattern
// or fetch session via API

export { auth as getServerSession } from "@/auth";

// For client components, use the useSession hook from next-auth/react
export { useSession, signIn, signOut } from "next-auth/react";
