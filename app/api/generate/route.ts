import { NextRequest, NextResponse } from "next/server";
import { db, projects, usageQuotas, users } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generatePRD, type PRDGenerationRequest, AIServiceError } from "@/lib/ai/client";
import { checkRateLimit } from "@/lib/ai/rate-limit";

// Helper function to create markdown PRD
function createMarkdown(
  idea: string,
  answers: {
    persona?: string;
    firstOpen?: string[];
    coreFeatures?: string[];
    betterThanCurrent?: string[];
    returnReasons?: string[];
  },
  techMode: string,
  stack: { frontend: string; backend: string; database: string; deployment: string },
  aiRecommendation?: {
    stack?: { frontend: string; backend: string; database: string; deployment: string };
  } | null
) {
  const stackSummary =
    techMode === "auto"
      ? `AI Recommendation: ${aiRecommendation?.stack?.frontend || "Next.js"} + ${aiRecommendation?.stack?.backend || "Supabase"} + ${aiRecommendation?.stack?.database || "PostgreSQL"} + ${aiRecommendation?.stack?.deployment || "Vercel"}`
      : `${stack.frontend} / ${stack.backend} / ${stack.database} / ${stack.deployment}`;

  const userFlow =
    (answers.firstOpen && answers.firstOpen.length > 0)
      ? answers.firstOpen.map((item: string) => `- ${item}`).join("\n")
      : "- Input ide awal\n- Validasi konteks\n- Preview draft PRD";

  const coreFeatures =
    (answers.coreFeatures && answers.coreFeatures.length > 0)
      ? answers.coreFeatures.map((item: string) => `- ${item}`).join("\n")
      : "- PRD generation\n- Visual flow generation\n- Tech stack recommendation";

  const differentiation =
    (answers.betterThanCurrent && answers.betterThanCurrent.length > 0)
      ? answers.betterThanCurrent.map((item: string) => `- ${item}`).join("\n")
      : "- Output lebih cepat\n- Struktur requirement lebih jelas\n- Workflow lebih fokus";

  const retentionDrivers =
    (answers.returnReasons && answers.returnReasons.length > 0)
      ? answers.returnReasons.map((item: string) => `- ${item}`).join("\n")
      : "- Dokumen mudah direvisi ulang\n- Riwayat ide tersimpan\n- Hasil bisa dipakai untuk iterasi berikutnya";

  const mermaidDiagram = `flowchart LR
  A[Input Ide] --> B[Preferensi Teknologi]
  B --> C[Pertanyaan Konteks]
  C --> D[Generate PRD]
  D --> E[Preview Dokumen]
  E --> F[Iterasi AI Agent]`;

  return `# PRD - ${idea.trim() || "SpecFlow Draft"}

## 1. Overview
Dokumen ini mendefinisikan kebutuhan produk untuk mengubah ide awal menjadi spesifikasi pengembangan yang terstruktur, dapat direview, dan siap dipakai sebagai acuan build.

## 2. Requirements
- Sistem harus menerima input ide dalam bahasa natural.
- Sistem harus memandu validasi konteks melalui pertanyaan terstruktur.
- Sistem harus menghasilkan dokumen PRD yang dapat dipreview, diedit, disalin, dan diunduh.
- Sistem harus menyediakan histori project untuk membuka kembali draft sebelumnya.

## 3. Core Features
${coreFeatures}

## 4. User Flow
${userFlow}

## 5. Architecture
Arsitektur direkomendasikan menggunakan pembagian frontend, backend, database, dan deployment yang ringan untuk MVP namun tetap modular untuk iterasi lanjutan.

## 6. Database Schema
- Projects: menyimpan ide awal, jawaban konteks, stack pilihan, hasil PRD, dan status.
- ProjectMessages: menyimpan histori interaksi revisi antara user dan AI reviewer.
- Users: menyimpan profil pengguna, tier aktif, dan kuota pemakaian.

## 7. Tech Stack
${stackSummary}

## 8. UI/UX Design Guidelines
- Workspace harus memprioritaskan dokumen dan alur review.
- Outline harus dapat digunakan untuk navigasi cepat antar-section.
- Interface harus tetap ringan secara visual walau memuat detail teknis.

## 9. Rekomendasi Prioritas MVP
- Input ide dan validasi konteks
- Generate draft PRD
- Preview dan edit markdown
- Histori plan dan export dasar

## 10. Strategi Monetisasi
- Freemium dibatasi pada eksplorasi dan validasi konteks.
- Starter membuka generate PRD terbatas, chat revisi, dan export premium.
- Pro membuka generate dan revisi tanpa batas selama subscription aktif.

## 11. Target Persona
${answers.persona || "Founder, AI builder, atau product operator yang ingin memvalidasi ide tanpa memulai dari dokumen kosong."}

## 12. Differentiation
${differentiation}

## 13. Retention Drivers
${retentionDrivers}

## 14. Mermaid Flow
\`\`\`mermaid
${mermaidDiagram}
\`\`\``;
}

// Helper function to analyze idea and recommend stack
function analyzeIdeaAndRecommend(idea: string) {
  const lowerIdea = idea.toLowerCase();
  const reasoning: string[] = [];

  const recommendedStack = {
    frontend: "Next.js",
    backend: "Supabase",
    database: "PostgreSQL",
    deployment: "Vercel",
  };

  // Keyword analysis
  const keywords = {
    realTime: ["real-time", "live", "chat", "collaborative", "multiplayer", "websocket", "streaming"],
    ecommerce: ["beli", "jualan", "toko", "shop", "store", "payment", "cart", "checkout", "ecommerce", "transaction"],
    mobile: ["mobile", "android", "ios", "app", "pwa", "responsive"],
    mvp: ["mvp", "simple", "basic", "minimal", "prototype", "starter"],
    largeScale: ["scale", "enterprise", "large", "millions", "high-traffic"],
    api: ["api", "backend", "service", "microservices", "rest", "graphql"],
    dataHeavy: ["data", "analytics", "report", "dashboard", "visualization", "insights", "metrics"],
    auth: ["login", "auth", "user", "account", "secure", "permission", "signin", "signup"],
    cms: ["blog", "content", "cms", "article", "news", "media", "editor"],
    ai: ["ai", "machine learning", "ml", "model", "prediction", "openai", "llm", "chatbot"],
  };

  const hasKeyword = (category: keyof typeof keywords) => {
    return keywords[category].some((keyword) => lowerIdea.includes(keyword));
  };

  // Adjust recommendations based on keywords
  if (hasKeyword("mobile")) {
    recommendedStack.frontend = "React Native Web";
    reasoning.push("Mobile-first: React Native Web memungkinkan code sharing antara web dan mobile");
  } else if (hasKeyword("cms") || hasKeyword("ecommerce")) {
    recommendedStack.frontend = "Next.js";
    reasoning.push("Next.js: SSR/SSG untuk SEO, performance, dan dynamic content pada CMS/E-commerce");
  } else if (hasKeyword("ai")) {
    recommendedStack.backend = "FastAPI";
    reasoning.push("FastAPI: Python framework yang ideal untuk AI/ML integration");
  } else if (hasKeyword("realTime")) {
    recommendedStack.backend = "Supabase";
    reasoning.push("Supabase: Real-time subscriptions bawaan untuk live/chat features");
  }

  return {
    stack: recommendedStack,
    reasoning,
  };
}

// POST /api/generate - Generate PRD from idea
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, idea, answers, techMode, stack } = body;

    if (!userId || !idea) {
      return NextResponse.json(
        { error: "Missing required fields: userId, idea" },
        { status: 400 }
      );
    }

    // Check user's monthly quota for PRD generation
    const currentMonth = new Date().toISOString().slice(0, 7);

    let quota = await db
      .select()
      .from(usageQuotas)
      .where(and(eq(usageQuotas.userId, userId), eq(usageQuotas.month, currentMonth)))
      .get();

    if (!quota) {
      const newQuotaId = nanoid();
      quota = await db
        .insert(usageQuotas)
        .values({
          id: newQuotaId,
          userId,
          month: currentMonth,
          prdCount: 0,
          chatCount: 0,
        })
        .returning()
        .get();
    }

    // Check user tier and limits
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const tierLimits = {
      Freemium: { prd: 1 },
      Starter: { prd: 5 },
      Pro: { prd: Infinity },
    };

    const userLimit = tierLimits[user.tier as keyof typeof tierLimits] || { prd: 1 };

    if (quota.prdCount >= userLimit.prd && userLimit.prd !== Infinity) {
      return NextResponse.json(
        { error: "Monthly PRD generation limit reached. Please upgrade your plan." },
        { status: 429 }
      );
    }

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(userId, user.tier as "Freemium" | "Starter" | "Pro");
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait a moment before trying again.",
          resetAt: rateLimitCheck.resetAt,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitCheck.resetAt
              ? Math.ceil((rateLimitCheck.resetAt.getTime() - Date.now()) / 1000).toString()
              : "60",
          },
        }
      );
    }

    // Generate PRD using AI
    const aiRequest: PRDGenerationRequest = {
      idea,
      answers,
      techMode: techMode || "auto",
      stack,
    };

    let aiResult;
    try {
      aiResult = await generatePRD(aiRequest);
    } catch (error) {
      if (error instanceof AIServiceError) {
        console.error("AI generation error:", error.message);
        return NextResponse.json(
          { error: `AI generation failed: ${error.message}. Please check your API keys and try again.` },
          { status: 500 }
        );
      }
      throw error;
    }

    const generatedPrd = aiResult.markdown;
    const finalStack = aiResult.stack || (techMode === "auto" ? analyzeIdeaAndRecommend(idea).stack : stack);

    // Create project
    const projectId = nanoid();
    const title = idea.substring(0, 50) + (idea.length > 50 ? "..." : "");

    await db.insert(projects).values({
      id: projectId,
      userId,
      title,
      initialIdea: idea,
      answers: answers ? JSON.stringify(answers) : null,
      techMode: techMode || "auto",
      stack: finalStack ? JSON.stringify(finalStack) : null,
      generatedPrd,
      status: "Generated",
      tier: user.tier,
    });

    // Update quota
    await db
      .update(usageQuotas)
      .set({
        prdCount: quota.prdCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(usageQuotas.id, quota.id))
      .run();

    return NextResponse.json({
      project: {
        id: projectId,
        title,
        generatedPrd,
        status: "Generated",
        stack: finalStack,
      },
      quota: {
        used: quota.prdCount + 1,
        limit: userLimit.prd === Infinity ? "Unlimited" : userLimit.prd,
      },
    });
  } catch (error) {
    console.error("Error in generate API:", error);
    return NextResponse.json({ error: "Failed to generate PRD" }, { status: 500 });
  }
}
