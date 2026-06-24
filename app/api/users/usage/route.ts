import { NextRequest, NextResponse } from "next/server";
import { db, usageQuotas, users } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

// GET /api/users/usage - Get user usage statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user tier
    const user = (await db.select().from(users).where(eq(users.id, session.user.id)).limit(1))[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current month's quota
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    let quota = (await db
      .select()
      .from(usageQuotas)
      .where(and(eq(usageQuotas.userId, session.user.id), eq(usageQuotas.month, currentMonth)))
      .limit(1))[0];

    if (!quota) {
      // Create new quota record if doesn't exist
      quota = {
        id: "",
        userId: session.user.id,
        month: currentMonth,
        prdCount: 0,
        chatCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Get limits based on tier
    const tierLimits = {
      Freemium: { prd: 1, chat: 0 },
      Starter: { prd: 5, chat: 100 },
      Pro: { prd: Infinity, chat: Infinity },
    };

    const limits = tierLimits[user.tier as keyof typeof tierLimits] || tierLimits.Freemium;

    // Calculate renew date (first day of next month)
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    const renewDate = nextMonth.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return NextResponse.json({
      usage: {
        prdUsed: quota.prdCount,
        prdLimit: limits.prd,
        chatUsed: quota.chatCount,
        chatLimit: limits.chat,
        renewDate,
      },
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
