import { NextResponse } from "next/server";
import { db } from "@/lib/db/pg-adapter";
import { users, accounts } from "@/lib/db/schema";
import { generateId } from "better-auth";

export async function GET() {
  try {
    // Test data mock dari Google OAuth
    const googleUser = {
      id: "google_123456789",
      email: "test@gmail.com",
      name: "Test User",
      picture: "https://example.com/avatar.jpg",
    };

    // 1. Cek apakah user sudah ada
    const existingUser = await db.query.users.findFirst({
      where: (user, { eq }) => eq(user.email, googleUser.email),
    });

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      await db.insert(accounts).values({
        id: generateId(),
        userId: userId,
        accountId: googleUser.id,
        providerId: "google",
        accessToken: "test_token",
        refreshToken: "test_refresh",
        idToken: "test_id_token",
        expiresAt: new Date(Date.now() + 3600 * 1000),
      });
      return NextResponse.json({
        success: true,
        message: "Linked existing user to Google account",
        userId,
        email: googleUser.email,
      });
    }

    // 2. Create user baru
    userId = generateId();
    await db.insert(users).values({
      id: userId,
      name: googleUser.name,
      email: googleUser.email,
      emailVerified: true,
      avatar: googleUser.picture,
      tier: "Freemium",
    });

    // 3. Create account
    await db.insert(accounts).values({
      id: generateId(),
      userId: userId,
      accountId: googleUser.id,
      providerId: "google",
      accessToken: "test_token",
      refreshToken: "test_refresh",
      idToken: "test_id_token",
      expiresAt: new Date(Date.now() + 3600 * 1000),
    });

    return NextResponse.json({
      success: true,
      message: "Created new user with Google account",
      userId,
      email: googleUser.email,
      name: googleUser.name,
    });
  } catch (error: any) {
    console.error("Test OAuth create error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
