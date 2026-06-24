// Auth utilities and helpers
// Avoid direct auth export to prevent client-side bundling

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

// Server-side auth access (dynamic import)
export async function getAuth() {
  const { auth } = await import("@/auth");
  return auth;
}

export async function getSignIn() {
  const { signIn } = await import("@/auth");
  return signIn;
}

export async function getSignOut() {
  const { signOut } = await import("@/auth");
  return signOut;
}
