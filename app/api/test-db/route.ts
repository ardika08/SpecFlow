import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    // Test query untuk cek koneksi database
    const { db } = await import("@/lib/db/pg-adapter");
    const { users } = await import("@/lib/db/schema");

    const result = await db.select().from(users).limit(1);

    return NextResponse.json({
      success: true,
      message: "Database connection OK",
      userCount: result.length,
      firstUser: result[0] || null,
      authConfig: {
        baseURL: process.env.BETTER_AUTH_URL,
        googleClientId: process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT_SET",
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT_SET",
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
