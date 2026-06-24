import { NextRequest, NextResponse } from "next/server";
import { createMayarClient, SUBSCRIPTION_PLANS } from "@/lib/mayar/client";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

// POST /api/payment - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, phone } = body;

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    // Find the selected plan
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    // Get user info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (db as any).select().from(users).where(eq(users.id, session.user.id)).get();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Simpan phone ke DB jika user input nomor WA baru
    const customerPhone = phone || user.phone;
    if (phone && phone !== user.phone) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).update(users)
        .set({ phone, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .run();
    }

    // Generate unique timestamp for this payment
    const ts = Date.now().toString().slice(-8);

    // Create payment with Mayar
    const mayar = createMayarClient();
    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

    const paymentRequest = {
      name: `SpecFlow ${plan.name} ${ts}`,
      amount: plan.price,
      description: `Langganan ${plan.name} - ${user.email} - ${ts}`,
      redirectUrl: `${baseUrl}/subscription?status=success&plan=${plan.tier}&t=${ts}`,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: customerPhone || undefined,
    };

    const paymentResponse = await mayar.createPayment(paymentRequest);

    if (!paymentResponse.success || !paymentResponse.data) {
      return NextResponse.json(
        { error: paymentResponse.message || "Gagal membuat pembayaran. Silakan coba lagi." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentResponse.data.id,
        payment_url: paymentResponse.data.link,
        payment_link_id: paymentResponse.data.paymentLinkId,
      },
      plan: {
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        price: plan.price,
        interval: plan.interval,
      },
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}

// GET /api/payment - Get available plans
export async function GET() {
  return NextResponse.json({
    plans: SUBSCRIPTION_PLANS,
  });
}
