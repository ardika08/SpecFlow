/**
 * Server-side auth helpers untuk API routes.
 *
 * Sebelumnya, endpoint seperti /api/generate, /api/chat, /api/projects
 * menerima `userId` & `tier` dari request body tanpa verifikasi session,
 * sehingga bisa di-bypass dengan mengirim nilai arbitrary.
 *
 * Helper ini membungkus `auth.api.getSession` agar semua API route
 * dapat memverifikasi identitas user dari cookie session secara konsisten.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export type Tier = "Freemium" | "Starter" | "Pro";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  tier: Tier;
};

/**
 * Hasil dari getSessionUser.
 *
 * Menggunakan discriminated union agar TypeScript bisa men-narrow tipe
 * setelah pengecekan `response`:
 *   - Jika `response !== null`  → user pasti null (unauthorized)
 *   - Jika `response === null`  → user pasti non-null (authorized)
 */
export type SessionResult =
  | { user: AuthenticatedUser; response: null }
  | { user: null; response: NextResponse };

/**
 * Verifikasi session dari request dan kembalikan data user.
 *
 * Menggunakan discriminated union untuk type-safety:
 * setelah `if (response) return response;`, TypeScript tahu bahwa
 * `user` adalah `AuthenticatedUser` (bukan null).
 *
 * @example
 * ```ts
 * const { user, response } = await getSessionUser(request);
 * if (response) return response;
 * // user.id & user.tier terjamin non-null
 * ```
 */
export async function getSessionUser(
  request: NextRequest
): Promise<SessionResult> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return {
        user: null,
        response: NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        ),
      };
    }

    // Ambil tier terbaru dari DB (bukan dari session yang mungkin stale)
    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .get();

    if (!dbUser) {
      return {
        user: null,
        response: NextResponse.json(
          { error: "User not found" },
          { status: 401 }
        ),
      };
    }

    return {
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        tier: (dbUser.tier as Tier) || "Freemium",
      },
      response: null,
    };
  } catch (error) {
    console.error("Error verifying session:", error);
    return {
      user: null,
      response: NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      ),
    };
  }
}
