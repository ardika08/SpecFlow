import { NextRequest } from "next/server";
import { generatePRDStream, type PRDGenerationRequest, AIServiceError } from "@/lib/ai/client";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { getSessionUser } from "@/lib/auth/session";
import { db, usageQuotas } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { notifyQuotaWarning } from "@/lib/notifications/notify";

// Tier limits untuk PRD generation
const PRD_TIER_LIMITS: Record<string, number> = {
  Freemium: 1,
  Starter: 5,
  Pro: Infinity,
};

/**
 * POST /api/generate/stream - Generate PRD with streaming response
 *
 * This endpoint streams the AI-generated PRD in real-time,
 * allowing the frontend to show progress as content is generated.
 *
 * Auth: Session diverifikasi server-side via Better Auth cookie.
 * userId & tier diambil dari session, bukan dari request body.
 */
export async function POST(request: NextRequest) {
  try {
    // Verifikasi session — tolongan jika belum login
    const { user, response: authResponse } = await getSessionUser(request);
    if (authResponse) return authResponse;

    const body = await request.json();
    const { idea, answers, techMode, stack } = body;

    if (!idea) {
      return new Response(
        JSON.stringify({ error: "Missing required field: idea" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Rate limiting check berdasarkan user dari session
    const rateLimit = await checkRateLimit(user.id, user.tier);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait a moment before trying again.",
          resetAt: rateLimit.resetAt,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": rateLimit.resetAt
              ? Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
              : "60",
          },
        }
      );
    }

    // Cek & update kuota PRD bulanan
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    let quota = await db
      .select()
      .from(usageQuotas)
      .where(and(eq(usageQuotas.userId, user.id), eq(usageQuotas.month, currentMonth)))
      .get();

    if (!quota) {
      const newQuotaId = nanoid();
      quota = await db
        .insert(usageQuotas)
        .values({
          id: newQuotaId,
          userId: user.id,
          month: currentMonth,
          prdCount: 0,
          chatCount: 0,
        })
        .returning()
        .get();
    }

    const prdLimit = PRD_TIER_LIMITS[user.tier] ?? 0;

    if (quota.prdCount >= prdLimit && prdLimit !== Infinity) {
      return new Response(
        JSON.stringify({
          error: "Monthly PRD limit reached. Please upgrade your plan.",
          quota: { used: quota.prdCount, limit: prdLimit === Infinity ? "Unlimited" : prdLimit },
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Increment PRD count
    const newPrdCount = quota.prdCount + 1;
    await db
      .update(usageQuotas)
      .set({ prdCount: newPrdCount, updatedAt: new Date() })
      .where(eq(usageQuotas.id, quota.id))
      .run();

    // Kirim notifikasi quota warning jika mendekati limit (80% atau 1 sisa)
    if (prdLimit !== Infinity && prdLimit - newPrdCount <= Math.max(1, Math.ceil(prdLimit * 0.2))) {
      notifyQuotaWarning(
        user.id, user.email, user.name,
        newPrdCount, prdLimit, user.tier, "PRD"
      ).catch((e) => console.error("Failed to send quota warning:", e));
    }

    const aiRequest: PRDGenerationRequest = {
      idea,
      answers,
      techMode: techMode || "auto",
      stack,
    };

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = "";
          const chunkSize = 50; // Send chunks of this size for better UX

          await generatePRDStream(
            aiRequest,
            (chunk) => {
              buffer += chunk;

              // Send buffered chunks for smoother streaming
              while (buffer.length >= chunkSize) {
                const sendChunk = buffer.slice(0, chunkSize);
                buffer = buffer.slice(chunkSize);

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ chunk: sendChunk })}\n\n`)
                );
              }
            }
          );

          // Send any remaining buffer
          if (buffer) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk: buffer })}\n\n`)
            );
          }

          // Send completion signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          if (error instanceof AIServiceError) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
            );
          } else {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: "Generation failed" })}\n\n`)
            );
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Stream generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to start streaming" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
