import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * POST /api/users/password - Not supported for OAuth users
 *
 * This project uses Google OAuth only, so password change is not available.
 * This endpoint returns a 400 error to indicate this functionality is not supported.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Password change not available for OAuth users
    return NextResponse.json(
      { error: "Password change is not available for Google OAuth users" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in password endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
