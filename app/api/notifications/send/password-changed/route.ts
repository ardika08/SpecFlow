import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { notifyPasswordChanged } from "@/lib/notifications/notify";

/**
 * POST /api/notifications/send/password-changed
 *
 * Memicu notifikasi (in-app + email) setelah user berhasil mengubah password.
 * Endpoint ini dipanggil dari client setelah `authClient.changePassword()` sukses,
 * karena change password dilakukan client-side via Better Auth.
 *
 * Auth: Session diverifikasi. Hanya untuk user yang sedang login.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, response: authResponse } = await getSessionUser(request);
    if (authResponse || !user) return authResponse || new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    );

    // Kirim notifikasi password changed (in-app + email, best-effort)
    await notifyPasswordChanged(user.id, user.email, user.name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending password-changed notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
