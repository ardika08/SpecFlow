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
