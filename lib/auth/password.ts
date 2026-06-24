// Password helper - placeholder for backward compatibility
// Not used with Google OAuth

export async function hashPassword(password: string): Promise<string> {
  // Placeholder - not used with Google OAuth
  // If needed later, use bcrypt
  return password;
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // Placeholder - not used with Google OAuth
  return password === hash;
}

// Check if a hash is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
export function isBcryptHash(hash: string): boolean {
  return /^\$2[aby]\$/.test(hash);
}
