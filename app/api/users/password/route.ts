import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * POST /api/users/password - Change user password
 *
 * Endpoint ini sekarang mem-proxy ke Better Auth change-password API
 * (POST /api/auth/change-password) untuk memastikan password diverifikasi
 * dan di-hash menggunakan mekanisme Better Auth (scrypt hash di tabel accounts).
 *
 * Sebelumnya, endpoint ini menulis/membaca password plaintext di
 * users.password_hash, yang tidak aman dan tidak kompatibel dengan
 * user yang register via Better Auth.
 *
 * Catatan: Frontend (settings page) sekarang langsung memanggil
 * authClient.changePassword() dari Better Auth client. Endpoint ini
 * tetap dipertahankan untuk backward compatibility.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Delegasikan ke Better Auth change-password API
    const result = await auth.api.changePassword({
      headers: request.headers,
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
    });

    return NextResponse.json({
      message: "Password changed successfully",
      user: result?.user,
    });
  } catch (error) {
    console.error("Error changing password:", error);

    // Better Auth throws APIError with status codes
    const message =
      error instanceof Error ? error.message : "Failed to change password";
    const status = (error as { status?: number })?.status || 500;

    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
