// Re-export NextAuth auth for backward compatibility
export { auth, signIn, signOut } from "@/auth";

// Session helpers
export { getSessionUser, requireSessionUser } from "./session";

// Password helper (not used with OAuth, but kept for backward compatibility)
export async function hashPassword(password: string): Promise<string> {
  // This is a placeholder - not used with Google OAuth
  // If you need password auth later, use bcrypt
  return password;
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // This is a placeholder - not used with Google OAuth
  return password === hash;
}
