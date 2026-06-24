import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { auth } from "@/auth";
import { hashPassword } from "@/lib/auth/password";
import { notifyWelcome } from "@/lib/notifications/notify";

// GET /api/users?id=xxx - Get a user by ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("id");
    const email = searchParams.get("email");

    let user;

    if (userId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user = await (db as any).select().from(users).where(eq(users.id, userId)).get();
    } else if (email) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user = await (db as any).select().from(users).where(eq(users.email, email)).get();
    } else {
      return NextResponse.json({ error: "User ID or email required" }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user without password hash
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, password" },
        { status: 400 }
      );
    }

    // Check if user already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingUser = await (db as any).select().from(users).where(eq(users.email, email)).get();
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const userId = nanoid();
    const hashedPassword = await hashPassword(password);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newUser = await (db as any)
      .insert(users)
      .values({
        id: userId,
        name,
        email,
        passwordHash: hashedPassword,
        tier: "Freemium",
      })
      .returning()
      .get();

    // Return user without password hash
    const { passwordHash: _passwordHash2, ...userWithoutPassword } = newUser;

    // Kirim notifikasi welcome (in-app + email, best-effort)
    notifyWelcome(newUser.id, newUser.email, newUser.name).catch((e) =>
      console.error("Failed to send welcome notification:", e)
    );

    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// PATCH /api/users - Update a user (partial update)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, avatar } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingUser = await (db as any).select().from(users).where(eq(users.id, userId)).get();
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: Record<string, string | Date | null> = {};
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar || null;
    updateData.updatedAt = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).update(users).set(updateData).where(eq(users.id, userId)).run();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedUser = await (db as any).select().from(users).where(eq(users.id, userId)).get();

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    // Return user without password hash
    const { passwordHash: _passwordHash, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/users - Delete a user
export async function DELETE(request: NextRequest) {
  try {
    // Get user from session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete user (cascade will handle related records)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).delete(users).where(eq(users.id, session.user.id)).run();

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
