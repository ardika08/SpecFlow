import { NextRequest } from "next/server";
import { db, projectMessages, usageQuotas, projects } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { chatWithAI, type ChatMessage } from "@/lib/ai/client";
import { getSessionUser } from "@/lib/auth/session";
import { notifyQuotaWarning } from "@/lib/notifications/notify";

// POST /api/chat - Send a message and get streaming AI response
//
// Auth: Session diverifikasi server-side. userId diambil dari session,
//       bukan dari request body. Project ownership diverifikasi sebelum
//       pesan disimpan.
export async function POST(request: NextRequest) {
  try {
    // Verifikasi session
    const { user, response: authResponse } = await getSessionUser(request);
    if (authResponse) return authResponse;

    const body = await request.json();
    const { projectId, message, history } = body;

    if (!projectId || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: projectId, message" }),
        { status: 400 }
      );
    }

    // Verifikasi ownership: project harus milik user yang login
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = await (db as any).select().from(projects).where(eq(projects.id, projectId)).get();

    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
    }

    if (project.userId !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    // Check user's monthly quota for chat
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let quota = await (db as any).select().from(usageQuotas).where(and(eq(usageQuotas.userId, user.id), eq(usageQuotas.month, currentMonth))).get();

    if (!quota) {
      // Create new quota record for this month
      const newQuotaId = nanoid();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      quota = await (db as any)
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

    // Check user tier and limits
    const tierLimits = {
      Freemium: { chat: 0 },
      Starter: { chat: 100 },
      Pro: { chat: Infinity },
    };

    const userLimit = tierLimits[user.tier] || { chat: 0 };

    if (quota.chatCount >= userLimit.chat && userLimit.chat !== Infinity) {
      return new Response(
        JSON.stringify({ error: "Monthly chat limit reached. Please upgrade your plan." }),
        { status: 429 }
      );
    }

    // Save user message
    const userMessageId = nanoid();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).insert(projectMessages).values({
      id: userMessageId,
      projectId,
      role: "user",
      content: message,
    });

    // Update quota
    const newChatCount = quota.chatCount + 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .update(usageQuotas)
      .set({
        chatCount: newChatCount,
        updatedAt: new Date(),
      })
      .where(eq(usageQuotas.id, quota.id))
      .run();

    // Kirim notifikasi quota warning jika mendekati limit (80% atau 5 sisa)
    if (userLimit.chat !== Infinity && userLimit.chat - newChatCount <= Math.max(5, Math.ceil(userLimit.chat * 0.2))) {
      notifyQuotaWarning(
        user.id, user.email, user.name,
        newChatCount, userLimit.chat, user.tier, "chat"
      ).catch((e) => console.error("Failed to send quota warning:", e));
    }

    // Prepare chat history for AI context
    const chatHistory: ChatMessage[] = (history || []).map((msg: ChatMessage) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add current message
    chatHistory.push({ role: "user", content: message });

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let aiResponse = "";
        let userMessageSent = false;

        try {
          // Send user message confirmation first
          if (!userMessageSent) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "user_message",
                  id: userMessageId,
                  role: "user",
                  content: message,
                })}\n\n`
              )
            );
            userMessageSent = true;
          }

          // Call AI with streaming
          const response = await chatWithAI(
            { messages: chatHistory, projectId },
            (chunk) => {
              aiResponse += chunk;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "chunk",
                    content: chunk,
                  })}\n\n`
                )
              );
            },
            undefined // Let AI client decide provider (Claude primary, OpenAI fallback)
          );

          aiResponse = response.content;

          // Save AI response to database
          const aiMessageId = nanoid();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any).insert(projectMessages).values({
            id: aiMessageId,
            projectId,
            role: "assistant",
            content: aiResponse,
          });

          // Send completion with AI message ID
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                id: aiMessageId,
                quota: {
                  used: quota.chatCount + 1,
                  limit: userLimit.chat === Infinity ? "Unlimited" : userLimit.chat,
                },
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error("AI Chat error:", error);

          // Send error message
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : "Failed to get AI response",
              })}\n\n`
            )
          );
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
    console.error("Error in chat API:", error);
    return new Response(JSON.stringify({ error: "Failed to process chat message" }), {
      status: 500,
    });
  }
}

// GET /api/chat?projectId=xxx - Get chat history for a project
//
// Auth: Session diverifikasi. Hanya owner project yang bisa melihat history.
export async function GET(request: NextRequest) {
  try {
    // Verifikasi session
    const { user, response: authResponse } = await getSessionUser(request);
    if (authResponse) return authResponse;

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID required" }), { status: 400 });
    }

    // Verifikasi ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = await (db as any)
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();

    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
    }

    if (project.userId !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = await (db as any)
      .select()
      .from(projectMessages)
      .where(eq(projectMessages.projectId, projectId))
      .orderBy(projectMessages.createdAt);

    return new Response(JSON.stringify({ messages }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch chat history" }), {
      status: 500,
    });
  }
}
