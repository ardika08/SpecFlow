import { createAuthClient } from "better-auth/react";

// Auto-detect base URL: gunakan window.location jika di browser (mendukung port dinamis),
// fallback ke env var atau localhost:3000 untuk SSR.
const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
  // Use native fetch for better cookie handling in Next.js
  fetchOptions: {
    credentials: "include",
  },
});

export const {
  useSession,
  signIn,
  signOut,
  signUp,
} = authClient;
