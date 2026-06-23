import { auth } from "@/auth";
import { headers } from "next/headers";

/**
 * Get authenticated user from session
 * Works in API routes and Server Components
 */
export async function getSessionUser() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  };
}

/**
 * Require authenticated user - throws if not authenticated
 */
export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Unauthorized: No active session");
  }

  return user;
}
