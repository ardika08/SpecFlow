import { createAuthClient } from "better-auth/react";
import type { auth } from "./index";

const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
  },
});

// Type-safe client with inferred types from server
export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"];
