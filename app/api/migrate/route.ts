import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/pg-adapter";

export async function GET(req: NextRequest) {
  const secret =
    req.nextUrl.searchParams.get("secret") ||
    req.headers.get("x-migration-secret");
  if (!process.env.MIGRATION_SECRET || secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Add accessTokenExpiresAt column to accounts table
    await db.execute(`
      ALTER TABLE accounts
      ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMP;
    `);

    return NextResponse.json({
      success: true,
      message: "Migration successful: Added access_token_expires_at column",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
