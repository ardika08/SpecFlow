import { auth } from "@/auth";

/**
 * Get authenticated user from session
 * Returns { user: null } if not authenticated for backward compatibility
 */
export async function getSessionUser(request?: Request) {
  const session = await auth();

  if (!session?.user) {
    return { user: null, response: null };
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    },
    response: null,
  };
}

/**
 * Require authenticated user - throws if not authenticated
 */
export async function requireSessionUser() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: No active session");
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  };
}
