import { NextRequest, NextResponse } from "next/server";
import { createMayarClient } from "@/lib/mayar/client";
import { db, users, usageQuotas } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { notifyPaymentSuccess } from "@/lib/notifications/notify";

// POST /api/webhooks/mayar - Handle Mayar payment notifications
export async function POST(request: NextRequest) {
  try {
    // Get Mayar client for signature verification
    const mayar = createMayarClient();

    // Parse request body
    const body = await request.json();

    // Verify webhook signature
    const webhookPayload = mayar.parseWebhook(request.headers, body);

    if (!webhookPayload) {
      console.error("Failed to parse webhook payload");
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    // Verify signature
    const isValid = mayar.verifyWebhookSignature(webhookPayload);

    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("Mayar webhook received:", webhookPayload);

    // Process the webhook based on status
    const { external_id, status, metadata } = webhookPayload;

    if (status === "PAID") {
      // Extract metadata
      const userId = metadata?.userId;
      const tier = metadata?.tier; // "Starter" or "Pro"

      if (!userId || !tier) {
        console.error("Missing required metadata in webhook");
        return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
      }

      // Calculate currentPeriodEnd (30 days from now)
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);

      // Update user tier
      await db.update(users)
        .set({
          tier: tier as string, // Explicit cast to satisfy type checker
          currentPeriodEnd: periodEnd,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId as string))
        .run();

      // Get or create usage quota for current month (reset for new subscription)
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      let quota = await db
        .select()
        .from(usageQuotas)
        .where(and(eq(usageQuotas.userId, userId as string), eq(usageQuotas.month, currentMonth)))
        .get();

      if (!quota) {
        const newQuotaId = nanoid();
        quota = await db
          .insert(usageQuotas)
          .values({
            id: newQuotaId,
            userId: userId as string,
            month: currentMonth,
            prdCount: 0,
            chatCount: 0,
          })
          .returning()
          .get();
      }

      console.log(`User ${userId} upgraded to ${tier} tier`);

      // Kirim notifikasi payment success (in-app + email, best-effort)
      const userRecord = await db.select().from(users).where(eq(users.id, userId as string)).get();
      if (userRecord) {
        notifyPaymentSuccess(
          userRecord.id,
          userRecord.email,
          userRecord.name,
          tier as string
        ).catch((e) => console.error("Failed to send payment notification:", e));
      }

      return NextResponse.json({ success: true, message: "Webhook processed successfully" });
    } else if (status === "EXPIRED" || status === "FAILED") {
      // Handle failed or expired payments
      console.log(`Payment ${external_id} ${status}`);
      return NextResponse.json({ success: true, message: "Webhook processed successfully" });
    }

    return NextResponse.json({ success: true, message: "Webhook received" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}

// GET /api/webhooks/mayar - Verify webhook endpoint is accessible
export async function GET() {
  return NextResponse.json({ message: "Mayar webhook endpoint is active" });
}
