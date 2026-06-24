"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * Session Provider Component
 * Wraps the app so client components can use `useSession()` from next-auth/react.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
