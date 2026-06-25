/**
 * AI Client for PRD Generation
 * Supports both Anthropic Claude and OpenAI with fallback
 */

// Provider types
export type AIProvider = "anthropic" | "openai";

export interface PRDGenerationRequest {
  idea: string;
  answers?: {
    persona?: string;
    firstOpen?: string[];
    coreFeatures?: string[];
    betterThanCurrent?: string[];
    returnReasons?: string[];
  };
  techMode: "auto" | "manual";
  stack?: {
    frontend?: string;
    backend?: string;
    database?: string;
    deployment?: string;
  };
}

export interface PRDGenerationResponse {
  markdown: string;
  stack?: {
    frontend: string;
    backend: string;
    database: string;
    deployment: string;
  };
  reasoning?: string[];
}

// Error types
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public provider?: AIProvider
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

/**
 * Anthropic Claude Client
 */
async function generateWithClaude(
  prompt: string,
  maxTokens: number = 8000
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new AIServiceError("ANTHROPIC_API_KEY is not configured", "missing_api_key", "anthropic");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: maxTokens,
      system: "Kamu adalah Product Manager senior yang ahli menulis PRD (Product Requirement Document) yang terstruktur rapi dan mudah dipahami. Output kamu selalu dalam format Markdown dengan penomoran section yang konsisten dari 1-13. Tulis dalam Bahasa Indonesia yang profesional.",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new AIServiceError(
      error.error?.message || "Anthropic API request failed",
      error.error?.type,
      "anthropic"
    );
  }

  const data = await response.json();
  return data.content[0]?.text || "";
}

/**
 * OpenAI GPT Client
 */
async function generateWithOpenAI(
  prompt: string,
  maxTokens: number = 8000
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new AIServiceError("OPENAI_API_KEY is not configured", "missing_api_key", "openai");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: maxTokens,
      messages: [
        {
          role: "system",
          content: "You are an expert Product Manager who writes clear, structured Product Requirement Documents (PRD) in Indonesian language. Your output should be in Markdown format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new AIServiceError(
      error.error?.message || "OpenAI API request failed",
      error.error?.code,
      "openai"
    );
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

/**
 * Generate PRD using AI (with fallback support)
 */
export async function generatePRD(
  request: PRDGenerationRequest,
  preferredProvider?: AIProvider
): Promise<PRDGenerationResponse> {
  const providers: AIProvider[] = preferredProvider
    ? ([preferredProvider, "openai", "anthropic"] as AIProvider[]).filter((p) => p !== preferredProvider)
    : (["anthropic", "openai"] as AIProvider[]);

  // Build the prompt
  const prompt = buildPRDPrompt(request);

  // Try each provider until one succeeds
  const errors: Array<{ provider: AIProvider; error: string }> = [];

  for (const provider of providers) {
    try {
      const markdown =
        provider === "anthropic"
          ? await generateWithClaude(prompt)
          : await generateWithOpenAI(prompt);

      // Extract stack info if available
      const stack = extractStack(markdown, request);

      return {
        markdown,
        stack,
      };
    } catch (error) {
      const errorMessage =
        error instanceof AIServiceError ? error.message : "Unknown error";
      errors.push({ provider, error: errorMessage });

      // If this is the preferred provider and it failed, log and try next
      console.warn(`${provider} failed: ${errorMessage}`);
    }
  }

  // All providers failed
  throw new AIServiceError(
    `All AI providers failed: ${errors.map((e) => `${e.provider}: ${e.error}`).join(", ")}`,
    "all_providers_failed"
  );
}

/**
 * Generate PRD with streaming support
 */
export async function generatePRDStream(
  request: PRDGenerationRequest,
  onChunk: (chunk: string) => void,
  preferredProvider?: AIProvider
): Promise<PRDGenerationResponse> {
  const providers: AIProvider[] = preferredProvider
    ? ([preferredProvider, "openai", "anthropic"] as AIProvider[]).filter((p) => p !== preferredProvider)
    : (["anthropic", "openai"] as AIProvider[]);

  const prompt = buildPRDPrompt(request);
  const errors: { provider: AIProvider; error: string }[] = [];

  for (const provider of providers) {
    try {
      if (provider === "anthropic") {
        return await streamWithClaude(prompt, onChunk);
      } else {
        return await streamWithOpenAI(prompt, onChunk);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push({ provider, error: errorMessage });
      console.warn(`${provider} streaming failed: ${errorMessage}`);
    }
  }

  throw new AIServiceError(
    `All AI providers failed for streaming: ${errors
      .map((e) => `${e.provider}: ${e.error}`)
      .join(", ")}`,
    "streaming_failed"
  );
}

/**
 * Stream with Claude (Server-Sent Events)
 */
async function streamWithClaude(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<PRDGenerationResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new AIServiceError("ANTHROPIC_API_KEY is not configured", "missing_api_key", "anthropic");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8000,
      stream: true,
      system: "Kamu adalah Product Manager senior yang ahli menulis PRD (Product Requirement Document) yang terstruktur rapi dan mudah dipahami. Output kamu selalu dalam format Markdown dengan penomoran section yang konsisten dari 1-13. Tulis dalam Bahasa Indonesia yang profesional.",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new AIServiceError("Anthropic streaming request failed", "stream_error", "anthropic");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new AIServiceError("No response body", "no_response_body", "anthropic");
  }

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            const text = parsed.delta.text;
            fullText += text;
            onChunk(text);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  return {
    markdown: fullText,
  };
}

/**
 * Stream with OpenAI (Server-Sent Events)
 */
async function streamWithOpenAI(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<PRDGenerationResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new AIServiceError("OPENAI_API_KEY is not configured", "missing_api_key", "openai");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 4000,
      stream: true,
      messages: [
        {
          role: "system",
          content: "You are an expert Product Manager who writes clear, structured Product Requirement Documents (PRD) in Indonesian language. Your output should be in Markdown format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new AIServiceError("OpenAI streaming request failed", "stream_error", "openai");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new AIServiceError("No response body", "no_response_body", "openai");
  }

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.choices?.[0]?.delta?.content) {
            const text = parsed.choices[0].delta.content;
            fullText += text;
            onChunk(text);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  return {
    markdown: fullText,
  };
}

/**
 * Build the PRD generation prompt
 */
function buildPRDPrompt(request: PRDGenerationRequest): string {
  const { idea, answers, techMode, stack } = request;

  let prompt = `Buatlah Product Requirement Document (PRD) yang lengkap dan terstruktur untuk ide produk berikut:

**IDE PRODUK:**
${idea}

`;

  // Add context from answers if available
  if (answers) {
    if (answers.persona) {
      prompt += `\n**TARGET PENGGUNA:**\n${answers.persona}\n`;
    }

    if (answers.firstOpen && answers.firstOpen.length > 0) {
      prompt += `\n**PERILAKU PENGGUNA SAAT PERTAMA KALI MEMBUKA APLIKASI:**\n${answers.firstOpen.join(", ")}\n`;
    }

    if (answers.coreFeatures && answers.coreFeatures.length > 0) {
      prompt += `\n**FITUR UTAMA YANG WAJIB ADA:**\n${answers.coreFeatures.join(", ")}\n`;
    }

    if (answers.betterThanCurrent && answers.betterThanCurrent.length > 0) {
      prompt += `\n**KEUNGGULAN DIBANDINGKAN SOLUSI EXISTING:**\n${answers.betterThanCurrent.join(", ")}\n`;
    }

    if (answers.returnReasons && answers.returnReasons.length > 0) {
      prompt += `\n**FAKTOR RETENSI (KENAPA PENGGUNA INGIN KEMBALI):**\n${answers.returnReasons.join(", ")}\n`;
    }
  }

  // Add tech stack info if manual mode
  if (techMode === "manual" && stack) {
    prompt += `\n**TECH STACK YANG DIPILIH USER (WAJIB digunakan di section 7 dan 8):**\n`;
    if (stack.frontend) prompt += `- Frontend: ${stack.frontend}\n`;
    if (stack.backend) prompt += `- Backend: ${stack.backend}\n`;
    if (stack.database) prompt += `- Database: ${stack.database}\n`;
    if (stack.deployment) prompt += `- Deployment: ${stack.deployment}\n`;
    prompt += `\nGUNAKAN tech stack di atas sebagai dasar arsitektur. JANGAN rekomendasikan stack lain kecuali ada alasan teknis yang kuat (jelaskan alasannya).\n`;
  } else if (techMode === "auto") {
    prompt += `\n**TECH STACK:** Mode otomatis — rekomendasikan tech stack terbaik yang paling cocok untuk ide ini. Jelaskan alasan pemilihan di section 7.\n`;
  }

  prompt += `\n**FORMAT OUTPUT:**
Tulis PRD dalam format Markdown dengan aturan berikut:
- Gunakan heading level 2 (##) untuk setiap section utama.
- Nomor section WAJIB berurutan dari 1 sampai 13, tidak boleh loncat.
- Heading ditulis persis dengan format: "## 1. Nama Section", "## 2. Nama Section", dst.
- Section yang wajib ada (dalam urutan ini, JANGAN diubah, JANGAN ditambah):

## 1. Overview
## 2. Problem Statement
## 3. Goals & Objectives
## 4. Target Users & Personas
## 5. Core Features
## 6. User Flow / User Journey
## 7. Technical Architecture & Tech Stack
## 8. Database Schema
## 9. API Specifications
## 10. UI/UX Guidelines
## 11. Success Metrics
## 12. Implementation Phases (MVP → Growth → Scale)
## 13. Risks & Mitigations

INSTRUKSI DETAIL PER SECTION (WAJIB diikuti):

**Section 5 - Core Features:** Jabarkan minimal 5 fitur utama. Setiap fitur harus punya: nama fitur, deskripsi singkat, dan prioritas (Must-have / Nice-to-have).

**Section 6 - User Flow:** Tulis step-by-step user journey yang bernomor (1, 2, 3...) dari pertama kali user membuka aplikasi sampai menyelesaikan task utama. Sertakan decision point dan alternatif path.

**Section 7 - Technical Architecture & Tech Stack:** WAJIB mencakup:
- Arsitektur sistem (monolith/microservice, client-server, dll)
- Frontend: framework, bahasa, state management
- Backend: framework, bahasa, API style (REST/GraphQL)
- Database: jenis, alasan pemilihan, apakah perlu caching (Redis, dll)
- Deployment & Hosting: platform, CI/CD, environment (staging/production)
- Diagram arsitektur sederhana dalam format text/mermaid jika memungkinkan
${techMode === "manual" ? "- WAJIB gunakan tech stack yang sudah dipilih user di atas." : "- Berikan rekomendasi dengan alasan teknis yang jelas."}

**Section 8 - Database Schema:** Tulis dalam format code block SQL atau tabel Markdown. Sertakan:
- Nama tabel, kolom, tipe data, constraint (PK, FK, UNIQUE, NOT NULL)
- Relasi antar tabel (one-to-many, many-to-many)
- Index yang direkomendasikan untuk performa

**Section 9 - API Specifications:** Tulis minimal 5-8 endpoint utama dalam format:
\`METHOD /path\` — Deskripsi, request body (jika ada), response format.

ATURAN UMUM:
- Di dalam setiap section, gunakan sub-heading (###) kalau perlu, tapi JANGAN pakai nomor di sub-heading.
- Gunakan bullet points, tabel, atau code block sesuai konteks.
- JANGAN mulai output dengan kalimat pengantar atau basa-basi. Langsung mulai dari "## 1. Overview".
- Setiap section HARUS berisi konten substantif minimal 3-5 paragraf/bullet points. JANGAN buat section kosong atau terlalu singkat.
- Tulis dalam Bahasa Indonesia yang profesional namun mudah dipahami.
- Total output harus komprehensif dan siap dijadikan acuan development.`;

  return prompt;
}

/**
 * Extract tech stack info from generated markdown
 */
function extractStack(markdown: string, request: PRDGenerationRequest) {
  // If manual mode, use the provided stack
  if (request.techMode === "manual" && request.stack) {
    return {
      frontend: request.stack.frontend || "Next.js",
      backend: request.stack.backend || "Supabase",
      database: request.stack.database || "PostgreSQL",
      deployment: request.stack.deployment || "Vercel",
    };
  }

  // Try to extract from markdown (for auto mode)
  const techStackSection = markdown.match(/(?:##?|\*\*)Technical Architecture|Tech Stack[\s\S]*?(?=##?|\*\*|$)/i)?.[0];

  if (techStackSection) {
    const stack = {
      frontend: "Next.js",
      backend: "Supabase",
      database: "PostgreSQL",
      deployment: "Vercel",
    };

    // Try to extract specific technologies
    const frontendMatch = techStackSection.match(/(?:Frontend|Front-end|UI)\s*[:：]\s*([^\n]+)/i);
    if (frontendMatch) stack.frontend = frontendMatch[1].trim();

    const backendMatch = techStackSection.match(/(?:Backend|Back-end|API)\s*[:：]\s*([^\n]+)/i);
    if (backendMatch) stack.backend = backendMatch[1].trim();

    const dbMatch = techStackSection.match(/(?:Database|DB)\s*[:：]\s*([^\n]+)/i);
    if (dbMatch) stack.database = dbMatch[1].trim();

    const deployMatch = techStackSection.match(/(?:Deployment|Deploy|Hosting)\s*[:：]\s*([^\n]+)/i);
    if (deployMatch) stack.deployment = deployMatch[1].trim();

    return stack;
  }

  // Default stack for auto mode
  return {
    frontend: "Next.js",
    backend: "Supabase",
    database: "PostgreSQL",
    deployment: "Vercel",
  };
}

// ===== CHAT AI AGENT FUNCTIONS =====

/**
 * Chat request types for interactive AI Agent
 */
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  projectId?: string;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Chat with Claude (streaming)
 * Menggunakan Haiku untuk chat/revisi — lebih cepat & hemat biaya.
 * PRD generation tetap pakai Sonnet (fungsi terpisah).
 */
export async function chatWithClaude(
  messages: ChatMessage[],
  onChunk?: (chunk: string) => void,
  maxTokens: number = 2000
): Promise<ChatResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new AIServiceError("ANTHROPIC_API_KEY is not configured", "missing_api_key", "anthropic");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: maxTokens,
      stream: !!onChunk,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new AIServiceError(
      error.error?.message || "Claude API request failed",
      error.error?.type,
      "anthropic"
    );
  }

  if (onChunk) {
    // Streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new AIServiceError("No response body", "no_response_body", "anthropic");
    }

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              const text = parsed.delta.text;
              fullText += text;
              onChunk(text);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    return { content: fullText };
  } else {
    // Non-streaming response
    const data = await response.json();
    return {
      content: data.content[0]?.text || "",
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      },
    };
  }
}

/**
 * Chat with OpenAI (streaming)
 * Menggunakan GPT-4o-mini untuk chat/revisi — lebih cepat & hemat biaya.
 * Fallback dari Claude Haiku jika Anthropic down.
 */
export async function chatWithOpenAI(
  messages: ChatMessage[],
  onChunk?: (chunk: string) => void,
  maxTokens: number = 2000
): Promise<ChatResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new AIServiceError("OPENAI_API_KEY is not configured", "missing_api_key", "openai");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: maxTokens,
      stream: !!onChunk,
      messages: [
        {
          role: "system",
          content: "You are an expert Product Manager and Technical Writer specializing in Product Requirement Documents (PRD). You help users refine, improve, and iterate on their product ideas. Your responses should be in Indonesian language, professional yet easy to understand. When asked to revise a PRD section, provide specific, actionable improvements.",
        },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new AIServiceError(
      error.error?.message || "OpenAI API request failed",
      error.error?.code,
      "openai"
    );
  }

  if (onChunk) {
    // Streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new AIServiceError("No response body", "no_response_body", "openai");
    }

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.choices?.[0]?.delta?.content) {
              const text = parsed.choices[0].delta.content;
              fullText += text;
              onChunk(text);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    return { content: fullText };
  } else {
    // Non-streaming response
    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || "",
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
    };
  }
}

/**
 * Chat with AI (with fallback support)
 * Tries Claude first, then falls back to OpenAI if Claude fails
 */
export async function chatWithAI(
  request: ChatRequest,
  onChunk?: (chunk: string) => void,
  preferredProvider?: AIProvider
): Promise<ChatResponse> {
  const providers: AIProvider[] = preferredProvider
    ? ([preferredProvider, "openai", "anthropic"] as AIProvider[]).filter((p) => p !== preferredProvider)
    : (["anthropic", "openai"] as AIProvider[]);

  // Build system message for PRD context
  const systemMessage: ChatMessage = {
    role: "system",
    content: `Anda adalah asisten AI ahli dalam Product Management dan Technical Writing yang berspesialisasi dalam Product Requirement Documents (PRD). Tugas Anda:

1. Membantu user me-refine ide produk menjadi spesifikasi yang lebih jelas
2. Memberikan saran teknis yang practical untuk implementasi
3. Menjawab pertanyaan tentang UX, arsitektur, dan best practices
4. Membantu mengidentifikasi gap atau area yang perlu diperjelas dalam PRD

Jawab dalam Bahasa Indonesia yang profesional namun mudah dipahami. Ketika diminta merevisi bagian PRD, berikan perubahan yang spesifik dan actionable.

Untuk konteks proyek ini:
- SpecFlow adalah tool untuk generate PRD dari ide kasar
- Output berupa Markdown dengan struktur: Overview, Requirements, Core Features, User Flow, Architecture, Database Schema, Tech Stack, UI/UX Guidelines
- Target user: AI Developer, Vibe Coder, Founder Indonesia`,
  };

  const messagesWithSystem: ChatMessage[] = [systemMessage, ...request.messages];

  const errors: Array<{ provider: AIProvider; error: string }> = [];

  for (const provider of providers) {
    try {
      if (provider === "anthropic") {
        return await chatWithClaude(messagesWithSystem, onChunk, request.maxTokens);
      } else {
        return await chatWithOpenAI(messagesWithSystem, onChunk, request.maxTokens);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push({ provider, error: errorMessage });
      console.warn(`${provider} chat failed: ${errorMessage}`);
    }
  }

  throw new AIServiceError(
    `All AI providers failed for chat: ${errors.map((e) => `${e.provider}: ${e.error}`).join(", ")}`,
    "all_providers_failed"
  );
}
