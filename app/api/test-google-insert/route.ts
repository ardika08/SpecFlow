import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Coba buat user Google OAuth secara manual untuk test
  try {
    const { auth } = await import("@/lib/auth");

    // Test apakah Better Auth bisa membuat user
    const testUser = {
      id: "test-google-" + Date.now(),
      email: "ardika.yudha08@gmail.com",
      name: "Test User",
      emailVerified: true,
    };

    // Coba insert langsung ke database
    const { db } = await import("@/lib/db/pg-adapter");
    const { users } = await import("@/lib/db/schema");

    const result = await db.insert(users).values(testUser).returning();

    return NextResponse.json({
      success: true,
      message: "Test insert berhasil",
      user: result[0],
      env: {
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
        NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
