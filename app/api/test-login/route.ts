import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    console.log("Test login attempt for:", email);

    // Test direct database query first
    const { db } = await import("@/lib/db");
    const { users, accounts } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    console.log("Found user:", user);

    const account = await db.select().from(accounts).where(eq(accounts.userId, user[0]?.id)).limit(1);
    console.log("Found account:", account);

    // Now test better-auth sign in
    console.log("Testing better-auth signIn...");
    const session = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    console.log("Sign in result:", JSON.stringify(session, null, 2));

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Login test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
