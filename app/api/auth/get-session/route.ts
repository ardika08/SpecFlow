import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db/pg-adapter";
import { users } from "@/lib/db/schema";

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

    // Ambil tier & phone terbaru dari Postgres (neon-http)
    const rows = await db
      .select({ tier: users.tier, phone: users.phone })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const user = rows[0];

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
