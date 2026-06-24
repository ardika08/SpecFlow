import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * GET /api/auth/get-session
 *
 * Returns the current session data including user tier from database.
 * This is used by client components to fetch session data.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Fetch user tier from database
    const { db, users } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (db as any)
      .select({ tier: users.tier, phone: users.phone })
      .from(users)
      .where(eq(users.id, session.user.id))
      .get();

    return NextResponse.json({
      user: {
        ...session.user,
        tier: user?.tier || "Freemium",
        phone: user?.phone || null,
      },
    });
  } catch (error) {
    console.error("Error in /api/auth/get-session:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
