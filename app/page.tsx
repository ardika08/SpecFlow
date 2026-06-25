"use client";

import { Children, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  Check,
  ChevronLeft,
  Code2,
  Copy,
  Database,
  Download,
  CreditCard,
  FileText,
  Globe,
  HelpCircle,
  LogIn,
  LogOut,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  MoonStar,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Settings,
  SendHorizontal,
  Server,
  Sparkles,
  UserPlus,
  Wand2,
  Workflow,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { BGPattern } from "@/components/ui/bg-pattern";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSession, signOut } from "@/lib/hooks";
import { NotificationProvider } from "@/components/notifications/notification-provider";

// Disable static optimization for authenticated page
export const dynamic = 'force-dynamic';

type Screen = "landing" | "tech" | "questions" | "generating" | "result" | "dashboard";
type Tier = "Freemium" | "Starter" | "Pro";
type ViewMode = "preview" | "edit";
type TechMode = "auto" | "manual";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string; id?: string };

type Project = {
  id: string;
  title: string;
  status: "Draft" | "Generated" | "Needs review";
  tier: Tier;
  updatedAt: string;
  summary: string;
};

type QuestionState = {
  persona: string;
  firstOpen: string[];
  coreFeatures: string[];
  betterThanCurrent: string[];
  returnReasons: string[];
};

type QuestionListKey = keyof Omit<QuestionState, "persona">;

type CustomQuestionField = {
  id: string;
  value: string;
};

type CustomQuestionState = Record<QuestionListKey, CustomQuestionField[]>;

type StackSelections = {
  frontend: string;
  backend: string;
  database: string;
  deployment: string;
};

type TechLayer = keyof StackSelections;

type CompatibilityScore = {
  score: number;
  level: "excellent" | "good" | "fair" | "warning" | "incompatible";
  explanation: string;
  pros: string[];
  cons: string[];
  warnings?: string[];
};

type TechInfo = {
  generalDescription: string;
  bestUseCase: string;
  learningCurve: "low" | "medium" | "high";
  scalingAbility: "limited" | "moderate" | "excellent";
  pros: string[];
  cons: string[];
  crossLayer?: {
    [targetLayer in TechLayer]?: {
      [targetTech: string]: string;
    };
  };
};

// Helper function to derive user display data from session
function getUserDisplayData(
  session: ReturnType<typeof useSession>["data"] | undefined,
  tierOverride?: string,
  usageData?: { prdUsed: number; prdLimit: number; chatUsed: number; chatLimit: number; renewDate: string } | null
) {
  if (!session?.user) {
    return null;
  }

  const user = session.user as { name?: string; email?: string; tier?: string | null };
  const name = user.name || "User";
  const email = user.email || "";
  const avatar = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const tier = tierOverride || (user.tier as string) || "Freemium";

  // Usage data dari API (tidak lagi mock)
  const prdUsage = usageData?.prdUsed ?? 0;
  const prdLimit = usageData?.prdLimit ?? (tier === "Freemium" ? 1 : tier === "Starter" ? 5 : Infinity);
  const chatUsage = usageData?.chatUsed ?? 0;
  const chatLimit = usageData?.chatLimit ?? (tier === "Freemium" ? 0 : tier === "Starter" ? 100 : Infinity);
  const chatCredits = Math.max(
    (chatLimit === Infinity ? 999 : chatLimit) - chatUsage,
    0
  );
  const renewDate = usageData?.renewDate || (() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return next.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  })();

  return {
    name,
    email,
    avatar,
    tier,
    chatCredits: chatLimit === Infinity ? "Unlimited" : `${chatCredits} chat`,
    prdUsage,
    prdLimit,
    chatUsage,
    chatLimit,
    renewDate,
  };
}

const starterQuestions = {
  firstOpen: ["Nulis ide dulu", "Ngintip hasil jadi", "Isi info seperlunya", "Langsung bikin akun"],
  coreFeatures: ["Ide auto jadi rapi", "Bikin flow biar kebayang", "Milih stack tanpa ribet", "Semua plan kekumpul"],
  betterThanCurrent: ["Lebih sat-set", "Ga muter-muter", "Lebih kebaca", "Ngirit waktu"],
  returnReasons: ["Mau ngeracik ide baru", "Hasilnya enak dicek ulang", "Kerjanya jadi enteng", "Team juga kepake"],
};

const stackOptions = {
  frontend: [
    "Next.js",
    "Nuxt",
    "Remix",
    "Astro",
    "SvelteKit",
    "Vue 3 + Vite",
    "SolidStart",
    "Qwik",
    "Angular",
    "React Native Web",
  ],
  backend: [
    "Supabase",
    "Node.js API",
    "NestJS",
    "Express.js",
    "FastAPI",
    "Django REST",
    "Flask",
    "Go Fiber",
    "Go Gin",
    "Go stdlib",
    "Spring Boot",
    "ASP.NET Core",
    "Elixir Phoenix",
    "Laravel",
    "Rails API",
    "Deno",
    "Bun",
  ],
  database: [
    "PostgreSQL",
    "Supabase Postgres",
    "Neon Postgres",
    "MySQL",
    "MongoDB",
    "Turso",
    "SurrealDB",
    "SQLite",
    "Redis",
    "Firebase",
  ],
  deployment: [
    "Vercel",
    "Railway",
    "Cloudflare",
    "Netlify",
    "Fly.io",
    "Docker VPS",
    "AWS Amplify",
    "Google Cloud Run",
    "Render",
    "Heroku",
    "DigitalOcean",
    "AWS Lambda",
  ],
};

const compatibilityMatrix: Record<TechLayer, Record<string, TechInfo>> = {
  frontend: {
    "Next.js": {
      generalDescription: "React framework dengan SSR/SSG dan API routes bawaan",
      bestUseCase: "Full-stack web apps yang butuh SEO dan performa tinggi",
      learningCurve: "medium",
      scalingAbility: "excellent",
      pros: ["SEO-friendly dengan SSR", "Zero-config deployment di Vercel", "API routes bawaan", "Ekosistem React besar"],
      cons: ["Butuh pengetahuan React", "Bundle size lumayan", "Learning curve untuk server components"],
      crossLayer: {
        backend: {
          "Laravel": "[WARNING] Butuh deployment terpisah - pertimbangkan API-first pattern",
          "Supabase": "[GOOD] Kombinasi sangat pas - integrasi auth & DB langsung",
          "Node.js API": "[GOOD] Natural fit - ekosistem sama",
          "Express.js": "[GOOD] Kompatibel baik - bisa satu monorepo",
        },
        deployment: {
          "Vercel": "[GOOD] Platform native - zero config deployment",
          "Netlify": "[GOOD] Support Next.js dengan baik",
          "Docker VPS": "[GOOD] Full control tapi butuh setup",
        },
        database: {
          "PostgreSQL": "[GOOD] Kombinasi populer dan reliable",
          "MongoDB": "[GOOD] Bisa digunakan dengan Prisma adapter",
          "Supabase Postgres": "[GOOD] Integrasi sangat mudah",
        },
      },
    },
    "Nuxt": {
      generalDescription: "Vue framework dengan SSR dan auto-imports",
      bestUseCase: "Vue-based apps yang butuh SEO dan modularitas",
      learningCurve: "medium",
      scalingAbility: "excellent",
      pros: ["Vue 3 composition API", "Auto-imports components", "SEO-friendly", "TypeScript support"],
      cons: ["Komunitas lebih kecil dari Next.js", "Documentation kadang kurang lengkap"],
      crossLayer: {
        backend: {
          "Laravel": "[GOOD] Bisa jadi frontend untuk Laravel API",
          "FastAPI": "[GOOD] Cocok sebagai frontend untuk Python API",
        },
        deployment: {
          "Vercel": "[GOOD] Support Nuxt 3 dengan baik",
          "Netlify": "[GOOD] Native support untuk Nuxt",
        },
      },
    },
    "Remix": {
      generalDescription: "React framework dengan nested routing dan form handling",
      bestUseCase: "Web apps yang fokus pada UX dan progressive enhancement",
      learningCurve: "medium",
      scalingAbility: "excellent",
      pros: ["Nested routing powerful", "Form handling built-in", "Progressive enhancement", "Standard web APIs"],
      cons: ["Konsep unik butuh adaptasi", "Ecosystem masih berkembang"],
      crossLayer: {
        backend: {
          "Node.js API": "[GOOD] Bisa jadi full-stack atau split",
          "Laravel": "[WARNING] Butuh integrasi manual untuk API",
        },
      },
    },
    "Vue 3 + Vite": {
      generalDescription: "Vue 3 dengan Vite untuk development experience cepat",
      bestUseCase: "SPA yang tidak butuh SSR",
      learningCurve: "low",
      scalingAbility: "moderate",
      pros: ["Development cepat dengan HMR", "Vue 3 composition API", "Bundle size kecil"],
      cons: ["Tidak ada SSR bawaan", "SEO perlu treatment khusus"],
      crossLayer: {
        deployment: {
          "Netlify": "[GOOD] Perfect untuk static SPA",
          "Vercel": "[GOOD] Support Vite dengan baik",
        },
      },
    },
    "Laravel + Blade": {
      generalDescription: "Traditional server-side rendering dengan Laravel Blade",
      bestUseCase: "Traditional web apps dengan server-side rendering",
      learningCurve: "low",
      scalingAbility: "moderate",
      pros: ["Simpel dan mudah dipelajari", "PHP ecosystem mature", "Full-stack Laravel"],
      cons: ["Tidak cocok untuk real-time apps", "Deployment monolithic"],
      crossLayer: {
        backend: {
          "Laravel": "[GOOD] Native pairing - sangat cocok",
        },
        deployment: {
          "Docker VPS": "[GOOD] Cocok untuk PHP deployment",
          "Railway": "[GOOD] Support Laravel",
        },
      },
    },
  },
  backend: {
    "Node.js API": {
      generalDescription: "REST API dengan Node.js dan Express/Fastify",
      bestUseCase: "API services untuk React/Next.js apps",
      learningCurve: "low",
      scalingAbility: "excellent",
      pros: ["JavaScript di frontend & backend", "NPM ecosystem luas", "Non-blocking I/O"],
      cons: ["Heavy computation bisa block event loop", "Callback hell kalau tidak hati-hati"],
      crossLayer: {
        frontend: {
          "Next.js": "[GOOD] Natural fit - ekosistem sama",
          "React Native Web": "[GOOD] Bisa share code",
        },
        database: {
          "PostgreSQL": "[GOOD] Kombinasi populer",
          "MongoDB": "[GOOD] MERN stack standard",
        },
        deployment: {
          "Railway": "[GOOD] Support Node.js dengan baik",
          "Render": "[GOOD] Easy deployment",
        },
      },
    },
    "Laravel": {
      generalDescription: "PHP framework dengan syntax elegant",
      bestUseCase: "Full-stack apps dengan backend-heavy logic",
      learningCurve: "medium",
      scalingAbility: "excellent",
      pros: ["Elegant syntax", "Ecosystem mature", "Queue & scheduler bawaan", "Auth scaffolding"],
      cons: ["Performance lebih rendah dari Node.js/Go", "Butuh PHP knowledge"],
      crossLayer: {
        frontend: {
          "Next.js": "[WARNING] Butuh deployment terpisah - consider API-first",
          "Laravel + Blade": "[GOOD] Native pairing - sangat cocok",
          "Vue 3 + Vite": "[GOOD] Laravel biasa include Vue scaffold",
        },
        database: {
          "MySQL": "[GOOD] Native pairing Laravel + MySQL",
          "PostgreSQL": "[GOOD] Good alternative ke MySQL",
        },
        deployment: {
          "Docker VPS": "[GOOD] Cocok untuk Laravel deployment",
          "Railway": "[GOOD] Support PHP",
        },
      },
    },
    "Supabase": {
      generalDescription: "Backend-as-a-Service dengan PostgreSQL, Auth, dan Storage",
      bestUseCase: "Apps yang butuh backend cepat tanpa server management",
      learningCurve: "low",
      scalingAbility: "moderate",
      pros: ["Real-time subscriptions", "Auth bawaan", "Storage bawaan", "PostgreSQL powered"],
      cons: ["Vendor lock-in risk", "Cost bisa tinggi untuk scale besar"],
      crossLayer: {
        frontend: {
          "Next.js": "[GOOD] Integrasi sangat mudah dengan client",
          "React Native Web": "[GOOD] Support mobile apps juga",
        },
        database: {
          "Supabase Postgres": "[GOOD] Native database",
        },
        deployment: {
          "Vercel": "[GOOD] Frontend di Vercel, backend Supabase",
        },
      },
    },
    "FastAPI": {
      generalDescription: "Modern Python framework dengan automatic API docs",
      bestUseCase: "API services dengan data processing/AI needs",
      learningCurve: "medium",
      scalingAbility: "excellent",
      pros: ["Automatic OpenAPI docs", "Type hints validation", "Async support", "Python ecosystem"],
      cons: ["Deployment lebih kompleks dari JavaScript", "Python performance lower than Go/Rust"],
      crossLayer: {
        frontend: {
          "Next.js": "[GOOD] Cocok untuk AI/data-heavy apps",
        },
        database: {
          "PostgreSQL": "[GOOD] Kombinasi Python + PG solid",
        },
      },
    },
    "NestJS": {
      generalDescription: "Node.js framework dengan TypeScript dan decorators",
      bestUseCase: "Enterprise-scale apps dengan arsitektur terstruktur",
      learningCurve: "high",
      scalingAbility: "excellent",
      pros: ["TypeScript native", "Structured architecture", "Dependency injection", "Microservices ready"],
      cons: ["Boilerplate lumayan banyak", "Learning curve tinggi"],
      crossLayer: {
        frontend: {
          "Next.js": "[GOOD] Sama-sama TypeScript ecosystem",
        },
        database: {
          "PostgreSQL": "[GOOD] TypeORM/Prisma support",
        },
      },
    },
    "Express.js": {
      generalDescription: "Minimalist Node.js framework",
      bestUseCase: "Simple APIs dan microservices",
      learningCurve: "low",
      scalingAbility: "moderate",
      pros: ["Minimal dan flexible", "Middleware ecosystem luas", "Easy to learn"],
      cons: ["Tidak ada structure bawaan", "Perlu manual setup untuk production"],
      crossLayer: {
        frontend: {
          "React Native Web": "[GOOD] MERN stack popular",
        },
      },
    },
    "Go Fiber": {
      generalDescription: "Express-inspired web framework untuk Go",
      bestUseCase: "High-performance API services",
      learningCurve: "medium",
      scalingAbility: "excellent",
      pros: ["Performance sangat tinggi", "Low memory footprint", "Concurrency built-in"],
      cons: ["Learning curve untuk Go", "Ecosystem lebih kecil dari Node.js"],
      crossLayer: {
        database: {
          "PostgreSQL": "[GOOD] Go + PG combination solid",
        },
      },
    },
    "Django REST": {
      generalDescription: "Python REST framework dengan Django",
      bestUseCase: "Data-driven APIs dengan admin interface",
      learningCurve: "medium",
      scalingAbility: "excellent",
      pros: ["Admin panel bawaan", "ORM powerful", "Security built-in", "Python ecosystem"],
      cons: ["Performance medium", "Monolithic biasanya"],
      crossLayer: {
        frontend: {
          "Django Templates": "[GOOD] Native pairing",
        },
        database: {
          "PostgreSQL": "[GOOD] Django + PG populer",
        },
      },
    },
    "Flask": {
      generalDescription: "Microframework untuk Python",
      bestUseCase: "Small services dan MVPs",
      learningCurve: "low",
      scalingAbility: "moderate",
      pros: ["Simpel dan minimal", "Flexible", "Easy untuk prototyping"],
      cons: ["Tidak ada structure bawaan", "Perlu manual setup"],
      crossLayer: {
        database: {
          "PostgreSQL": "[GOOD] SQLAlchemy support",
        },
      },
    },
    "Go Gin": {
      generalDescription: "High-performance HTTP framework untuk Go",
      bestUseCase: "API services yang butuh performa tinggi",
      learningCurve: "low",
      scalingAbility: "excellent",
      pros: ["Performance sangat tinggi", "Minimal dan fast", "Middleware support", "JSON validation"],
      cons: ["Ecosystem lebih kecil dari Node.js", "Learning curve untuk Go"],
      crossLayer: {
        frontend: {
          "Next.js": "[GOOD] Cocok untuk high-performance APIs",
        },
        database: {
          "PostgreSQL": "[GOOD] Go + PG combination solid",
          "MySQL": "[GOOD] Good MySQL driver support",
        },
        deployment: {
          "Docker VPS": "[GOOD] Perfect untuk Go binary deployment",
          "Railway": "[GOOD] Good Go support",
        },
      },
    },
    "Go stdlib": {
      generalDescription: "Go standard library net/http",
      bestUseCase: "Simple services dan microservices dengan kontrol penuh",
      learningCurve: "medium",
      scalingAbility: "excellent",
      pros: ["No dependencies", "Full control", "Performance maksimal", "Standard library lengkap"],
      cons: ["Perlu manual setup untuk banyak hal", "Boilerplate lebih banyak"],
      crossLayer: {
        database: {
          "PostgreSQL": "[GOOD] Native database/sql package",
        },
        deployment: {
          "Docker VPS": "[GOOD] Single binary deployment",
        },
      },
    },
    "Bun": {
      generalDescription: "Modern JavaScript runtime dengan built-in bundler dan test runner",
      bestUseCase: "Fast APIs dan serverless functions",
      learningCurve: "low",
      scalingAbility: "excellent",
      pros: ["Performance tinggi", "Drop-in Node.js compatible", "Built-in TypeScript", "All-in-one toolchain"],
      cons: ["Relatively new", "Ecosystem masih berkembang"],
      crossLayer: {
        frontend: {
          "Next.js": "[GOOD] Growing support for Next.js",
        },
        database: {
          "PostgreSQL": "[GOOD] Native drivers available",
        },
      },
    },
    "Deno": {
      generalDescription: "Secure runtime untuk JavaScript/TypeScript",
      bestUseCase: "Modern APIs dan serverless functions",
      learningCurve: "low",
      scalingAbility: "excellent",
      pros: ["Secure by default", "Built-in TypeScript", "Standard library modern", "ES modules native"],
      cons: ["Ecosystem lebih kecil dari Node.js", "Some npm packages tidak kompatibel"],
      crossLayer: {
        frontend: {
          "Next.js": "[GOOD] Deno Deploy works well",
        },
        database: {
          "PostgreSQL": "[GOOD] Native drivers available",
          "MongoDB": "[GOOD] Good MongoDB support",
        },
        deployment: {
          "Docker VPS": "[GOOD] Single binary deployment",
        },
      },
    },
    "Rails API": {
      generalDescription: "Ruby on Rails API mode",
      bestUseCase: "Rapid API development dengan convention over configuration",
      learningCurve: "medium",
      scalingAbility: "excellent",
      pros: ["Rapid development", "Mature ecosystem", "Gems丰富", "RESTful by default"],
      cons: ["Performance medium", "Monolithic biasanya"],
      crossLayer: {
        database: {
          "PostgreSQL": "[GOOD] Default pairing Rails + PG",
          "MySQL": "[GOOD] Good MySQL support",
        },
        deployment: {
          "Railway": "[GOOD] Ruby support available",
          "Heroku": "[GOOD] Traditional Rails platform",
        },
      },
    },
  },
  database: {
    "SQLite": {
      generalDescription: "Embedded database tanpa server",
      bestUseCase: "MVP, mobile apps, dan tools lokal",
      learningCurve: "low",
      scalingAbility: "limited",
      pros: ["Zero config", "Single file", "Perfect untuk MVP", "Built-in ke Python/Node"],
      cons: ["Tidak concurrent writes", "Tidak scalable untuk high traffic"],
      crossLayer: {
        deployment: {
          "Vercel": "[WARNING] Vercel serverless - SQLite tricky untuk production",
          "Docker VPS": "[GOOD] Perfect untuk VPS deployment",
        },
      },
    },
    "PostgreSQL": {
      generalDescription: "Open-source RDBMS powerful",
      bestUseCase: "Production apps yang butuh reliability dan features",
      learningCurve: "medium",
      scalingAbility: "excellent",
      pros: ["ACID compliant", "JSON support", "Extensions ecosystem", "Reliable"],
      cons: ["Setup complexity", "Resource usage lumayan"],
      crossLayer: {
        backend: {
          "Node.js API": "[GOOD] Popular combination",
          "Laravel": "[GOOD] Supported",
          "Django REST": "[GOOD] Native preference",
        },
        deployment: {
          "Railway": "[GOOD] Managed Postgres available",
          "Render": "[GOOD] Managed Postgres available",
          "Docker VPS": "[GOOD] Full control",
        },
      },
    },
    "Supabase Postgres": {
      generalDescription: "Managed PostgreSQL dengan real-time features",
      bestUseCase: "Apps yang butuh real-time dan managed database",
      learningCurve: "low",
      scalingAbility: "moderate",
      pros: ["Managed service", "Real-time subscriptions", "Auth integrated", "API bawaan"],
      cons: ["Vendor lock-in risk", "Cost scaling"],
      crossLayer: {
        backend: {
          "Supabase": "[GOOD] Native pairing",
        },
        frontend: {
          "Next.js": "[GOOD] Direct integration",
        },
      },
    },
    "MySQL": {
      generalDescription: "Popular open-source RDBMS",
      bestUseCase: "General-purpose apps dan legacy compatibility",
      learningCurve: "low",
      scalingAbility: "excellent",
      pros: ["Widely supported", "Mature", "Good performance"],
      cons: ["Features kurang dari PG", "JSON support kurang powerful"],
      crossLayer: {
        backend: {
          "Laravel": "[GOOD] Native pairing",
          "Node.js API": "[GOOD] Supported via drivers",
        },
      },
    },
    "MongoDB": {
      generalDescription: "NoSQL document database",
      bestUseCase: "Apps dengan flexible schema dan hierarchical data",
      learningCurve: "low",
      scalingAbility: "excellent",
      pros: ["Flexible schema", "Horizontal scaling", "Document-based"],
      cons: ["No joins native", "Memory usage tinggi", "Learning curve untuk NoSQL mindset"],
      crossLayer: {
        backend: {
          "Node.js API": "[GOOD] MERN stack standard",
          "Express.js": "[GOOD] Popular pairing",
        },
      },
    },
    "SurrealDB": {
      generalDescription: "Modern multi-model database",
      bestUseCase: "Apps yang butuh fleksibilitas data model",
      learningCurve: "medium",
      scalingAbility: "excellent",
      pros: ["Multi-model (document, graph, relational)", "Real-time capabilities", "Simple query language", "Edge deployment ready"],
      cons: ["Relatively new", "Ecosystem lebih kecil", "Limited tooling"],
      crossLayer: {
        deployment: {
          "Cloudflare": "[GOOD] Good untuk edge deployment",
          "Docker VPS": "[GOOD] Self-hosted option",
        },
      },
    },
    "Redis": {
      generalDescription: "In-memory data store untuk caching dan real-time",
      bestUseCase: "Caching, sessions, dan real-time data",
      learningCurve: "low",
      scalingAbility: "excellent",
      pros: ["Performance sangat tinggi", "Real-time pub/sub", "Rich data structures", "Scalable"],
      cons: ["Not persistent by default", "In-memory cost tinggi", "Biasanya perlu DB tambahan"],
      crossLayer: {
        backend: {
          "Node.js API": "[GOOD] Excellent Redis client ecosystem",
          "Go Fiber": "[GOOD] Good Redis support",
        },
        deployment: {
          "Railway": "[GOOD] Managed Redis available",
          "Docker VPS": "[GOOD] Self-hosted Redis",
        },
      },
    },
    "Firebase": {
      generalDescription: "Backend-as-a-Service dengan real-time database",
      bestUseCase: "Real-time apps dan mobile-first development",
      learningCurve: "low",
      scalingAbility: "moderate",
      pros: ["Real-time sync bawaan", "Auth bawaan", "Hosting bawaan", "NoSQL flexible"],
      cons: ["Vendor lock-in tinggi", "Cost unpredictable", "Query limitations"],
      crossLayer: {
        frontend: {
          "React Native Web": "[GOOD] Support mobile dan web",
          "Vue 3 + Vite": "[GOOD] Firebase SDK support",
        },
        deployment: {
          "Vercel": "[WARNING] Butuh Firebase hosting terpisah atau backend-only",
        },
      },
    },
    "Turso": {
      generalDescription: "SQLite-based edge database",
      bestUseCase: "Edge functions dan serverless apps",
      learningCurve: "low",
      scalingAbility: "moderate",
      pros: ["Edge deployment", "SQLite compatible", "Low latency"],
      cons: ["Feature limitations", "New product"],
      crossLayer: {
        deployment: {
          "Cloudflare": "[GOOD] Great untuk edge deployment",
          "Vercel": "[GOOD] Serverless compatible",
        },
      },
    },
  },
  deployment: {
    "Vercel": {
      generalDescription: "Platform untuk Next.js dan frontend frameworks",
      bestUseCase: "Next.js apps dan static sites",
      learningCurve: "low",
      scalingAbility: "excellent",
      pros: ["Zero-config untuk Next.js", "Global CDN", "Preview deployments", "Edge functions"],
      cons: ["Serverless limitations", "Cost scaling", "Vendor lock-in"],
      crossLayer: {
        frontend: {
          "Next.js": "[GOOD] Native platform",
          "Nuxt": "[GOOD] Good support",
          "Vue 3 + Vite": "[GOOD] Static site support",
        },
        backend: {
          "Supabase": "[GOOD] Popular combo",
        },
      },
    },
    "Netlify": {
      generalDescription: "Platform untuk JAMstack apps",
      bestUseCase: "Static sites dan serverless functions",
      learningCurve: "low",
      scalingAbility: "excellent",
      pros: ["Git-based deployment", "Form handling", "Edge functions", "Free tier generous"],
      cons: ["Build time limits", "Serverless constraints"],
      crossLayer: {
        frontend: {
          "Vue 3 + Vite": "[GOOD] Perfect untuk static",
          "SvelteKit": "[GOOD] Native support",
        },
      },
    },
    "Railway": {
      generalDescription: "Platform untuk meng-deploy berbagai app types",
      bestUseCase: "Full-stack apps dengan backend services",
      learningCurve: "low",
      scalingAbility: "moderate",
      pros: ["Support multiple languages", "Built-in Postgres", "Simple pricing"],
      cons: ["Regional limitations", "Scaling latency"],
      crossLayer: {
        backend: {
          "Node.js API": "[GOOD] Good support",
          "Laravel": "[GOOD] PHP support",
          "Django REST": "[GOOD] Python support",
        },
        database: {
          "PostgreSQL": "[GOOD] Managed Postgres built-in",
        },
      },
    },
    "Cloudflare": {
      generalDescription: "Edge computing platform dengan Workers",
      bestUseCase: "Edge functions dan static sites",
      learningCurve: "medium",
      scalingAbility: "excellent",
      pros: ["Global edge network", "Workers untuk compute", "KV storage", "D1 database"],
      cons: ["Cold starts", "Runtime limitations"],
      crossLayer: {
        database: {
          "Turso": "[GOOD] Great untuk edge",
        },
      },
    },
    "Render": {
      generalDescription: "Platform untuk web services dan static sites",
      bestUseCase: "General-purpose web deployment",
      learningCurve: "low",
      scalingAbility: "moderate",
      pros: ["Support multiple stacks", "Managed Postgres", "Simple pricing"],
      cons: ["Build time medium", "Scaling tidak instant"],
      crossLayer: {
        backend: {
          "Node.js API": "[GOOD] Good support",
          "Django REST": "[GOOD] Python support",
        },
      },
    },
    "Docker VPS": {
      generalDescription: "Self-hosted dengan Docker containers",
      bestUseCase: "Full control apps dan custom stacks",
      learningCurve: "high",
      scalingAbility: "excellent",
      pros: ["Full control", "Unlimited customization", "Cost predictable", "No vendor lock-in"],
      cons: ["Maintenance overhead", "Security responsibility", "Setup complexity"],
      crossLayer: {
        backend: {
          "Laravel": "[GOOD] Perfect untuk PHP apps",
          "Django REST": "[GOOD] Python apps",
        },
        database: {
          "PostgreSQL": "[GOOD] Full control database",
          "MySQL": "[GOOD] Good for containerized deployment",
          "MongoDB": "[GOOD] Flexible document storage",
        },
      },
    },
    "Fly.io": {
      generalDescription: "Platform untuk deploying apps close to users",
      bestUseCase: "Apps yang butuh multi-region deployment",
      learningCurve: "medium",
      scalingAbility: "excellent",
      pros: ["Multi-region", "Docker-based", "Postgres included", "Anycast network"],
      cons: ["Newer platform", "Learning curve"],
      crossLayer: {
        backend: {
          "Node.js API": "[GOOD] Good support",
          "Laravel": "[GOOD] PHP apps support",
        },
      },
    },
    "Heroku": {
      generalDescription: "Platform-as-a-Service untuk app deployment",
      bestUseCase: "Traditional web apps dan APIs",
      learningCurve: "low",
      scalingAbility: "moderate",
      pros: ["Easy deployment", "Add-ons ecosystem", "Mature platform"],
      cons: ["Expensive untuk production", "Cold starts", "Regional limitations"],
      crossLayer: {
        backend: {
          "Node.js API": "[GOOD] Good support",
          "Rails API": "[GOOD] Traditional Rails platform",
          "Django REST": "[GOOD] Python support",
        },
        database: {
          "PostgreSQL": "[GOOD] Managed Postgres available",
        },
      },
    },
    "DigitalOcean": {
      generalDescription: "Cloud platform dengan droplets dan App Platform",
      bestUseCase: "VPS hosting dan simple app deployment",
      learningCurve: "low",
      scalingAbility: "excellent",
      pros: ["Simple pricing", "Good documentation", "Multiple options"],
      cons: ["Manual scaling", "Less managed features"],
      crossLayer: {
        backend: {
          "Node.js API": "[GOOD] Good Node.js support",
          "Go Fiber": "[GOOD] Perfect untuk Go binaries",
          "Django REST": "[GOOD] Python apps",
        },
        database: {
          "PostgreSQL": "[GOOD] Managed Postgres available",
          "MySQL": "[GOOD] Managed MySQL available",
        },
      },
    },
    "AWS Lambda": {
      generalDescription: "Serverless compute service",
      bestUseCase: "Serverless functions dan event-driven apps",
      learningCurve: "high",
      scalingAbility: "excellent",
      pros: ["Pay-per-use", "Auto scaling", "Integrasi AWS services", "Zero cost when idle"],
      cons: ["Cold starts", "Complex setup", "Vendor lock-in"],
      crossLayer: {
        backend: {
          "Node.js API": "[GOOD] Good Lambda support",
          "Go stdlib": "[GOOD] Go runtime available",
        },
        deployment: {
          "Vercel": "[WARNING] Vercel already provides serverless",
        },
      },
    },
  },
};

const autoStackLabel = "AI Recommendation: Next.js + Better Auth + Node.js + PostgreSQL + Vercel";

const mermaidDiagram = `flowchart LR
  A[Input Ide] --> B[Preferensi Teknologi]
  B --> C[Pertanyaan Konteks]
  C --> D[Generate PRD]
  D --> E[Preview Dokumen]
  E --> F[Iterasi AI Agent]`;

function createMarkdown(idea: string, answers: QuestionState, techMode: TechMode, stack: StackSelections) {
  const stackSummary =
    techMode === "auto"
      ? autoStackLabel
      : `${stack.frontend} / ${stack.backend} / ${stack.database} / ${stack.deployment}`;

  const userFlow =
    answers.firstOpen.length > 0
      ? answers.firstOpen.map((item) => `- ${item}`).join("\n")
      : "- Input ide awal\n- Validasi konteks\n- Preview draft PRD";

  const coreFeatures =
    answers.coreFeatures.length > 0
      ? answers.coreFeatures.map((item) => `- ${item}`).join("\n")
      : "- PRD generation\n- Visual flow generation\n- Tech stack recommendation";

  const differentiation =
    answers.betterThanCurrent.length > 0
      ? answers.betterThanCurrent.map((item) => `- ${item}`).join("\n")
      : "- Output lebih cepat\n- Struktur requirement lebih jelas\n- Workflow lebih fokus";

  const retentionDrivers =
    answers.returnReasons.length > 0
      ? answers.returnReasons.map((item) => `- ${item}`).join("\n")
      : "- Dokumen mudah direvisi ulang\n- Riwayat ide tersimpan\n- Hasil bisa dipakai untuk iterasi berikutnya";

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

function calculateCompatibility(
  layer: TechLayer,
  tech: string,
  currentStack: StackSelections
): CompatibilityScore {
  let score = 70;
  const warnings: string[] = [];
  const pros: string[] = [];
  const cons: string[] = [];

  const techInfo = compatibilityMatrix[layer]?.[tech];

  if (!techInfo) {
    return {
      score: 50,
      level: "fair",
      explanation: "Informasi teknologi belum tersedia",
      pros: [],
      cons: ["Data kompatibilitas belum diinput"],
    };
  }

  // Copy base pros and cons from tech info
  pros.push(...techInfo.pros);
  cons.push(...techInfo.cons);

  // Base score modifiers based on learning curve and scaling ability
  if (techInfo.learningCurve === "low") score += 10;
  if (techInfo.learningCurve === "high") score -= 5;
  if (techInfo.scalingAbility === "excellent") score += 15;
  if (techInfo.scalingAbility === "limited") score -= 10;

  // Cross-layer compatibility checks
  for (const [otherLayer, otherTech] of Object.entries(currentStack)) {
    if (otherLayer === layer || !otherTech) continue;

    const crossCompat = techInfo.crossLayer?.[otherLayer as TechLayer]?.[otherTech];
    if (crossCompat) {
      if (crossCompat.includes("[WARNING]")) {
        warnings.push(crossCompat.replace(/\[WARNING\]|\[GOOD\]|\[BAD\]/g, "").trim());
        score -= 10;
      } else if (crossCompat.includes("[GOOD]")) {
        pros.push(crossCompat.replace(/[[WARNING]✅❌]/g, "").trim());
        score += 5;
      }
    }
  }

  // Clamp score between 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine level based on score
  const level =
    score >= 80
      ? "excellent"
      : score >= 60
        ? "good"
        : score >= 40
          ? "fair"
          : score >= 20
            ? "warning"
            : "incompatible";

  return {
    score,
    level,
    explanation: techInfo.generalDescription,
    pros: pros.slice(0, 5), // Limit to 5 pros
    cons: cons.slice(0, 4), // Limit to 4 cons
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

function createEmptyCustomAnswers(): CustomQuestionState {
  return {
    firstOpen: [],
    coreFeatures: [],
    betterThanCurrent: [],
    returnReasons: [],
  };
}

function mergeAnswersWithCustom(answers: QuestionState, customAnswers: CustomQuestionState): QuestionState {
  return {
    persona: answers.persona,
    firstOpen: [...answers.firstOpen, ...customAnswers.firstOpen.map((item) => item.value.trim()).filter(Boolean)],
    coreFeatures: [...answers.coreFeatures, ...customAnswers.coreFeatures.map((item) => item.value.trim()).filter(Boolean)],
    betterThanCurrent: [...answers.betterThanCurrent, ...customAnswers.betterThanCurrent.map((item) => item.value.trim()).filter(Boolean)],
    returnReasons: [...answers.returnReasons, ...customAnswers.returnReasons.map((item) => item.value.trim()).filter(Boolean)],
  };
}

function extractHeadings(markdown: string) {
  return markdown
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const label = line.replace("## ", "").trim();
      return {
        id: label
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-"),
        label,
      };
    });
}

function getRecommendations(
  changedLayer: TechLayer,
  selectedTech: string,
  currentStack: StackSelections
): string[] {
  const recommendations: string[] = [];

  // Modern stack recommendations based on layer
  if (changedLayer === "frontend") {
    if (currentStack.backend === "Supabase") {
      if (selectedTech !== "Next.js" && selectedTech !== "Nuxt") {
        recommendations.push("Next.js atau Nuxt lebih cocok dengan Supabase karena integrasi auth dan DB yang native");
      }
    }
    if (currentStack.database === "PostgreSQL" || currentStack.database === "Supabase Postgres") {
      if (selectedTech !== "Next.js" && selectedTech !== "Remix") {
        recommendations.push("Next.js atau Remix memberikan pengalaman terbaik dengan PostgreSQL");
      }
    }
    if (currentStack.deployment === "Vercel") {
      if (selectedTech !== "Next.js") {
        recommendations.push("Next.js adalah native platform untuk Vercel dengan zero-config deployment");
      }
    }
  }

  if (changedLayer === "backend") {
    if (currentStack.frontend === "Next.js" || currentStack.frontend === "React") {
      if (selectedTech !== "Node.js API" && selectedTech !== "Supabase" && selectedTech !== "NestJS") {
        recommendations.push("Node.js API, Supabase, atau NestJS memberikan integrasi seamless dengan Next.js");
      }
    }
    if (currentStack.database === "PostgreSQL" || currentStack.database === "Supabase Postgres") {
      if (selectedTech !== "Django REST" && selectedTech !== "Spring Boot" && selectedTech !== "Supabase") {
        recommendations.push("Django REST, Spring Boot, atau Supabase sangat kompatibel dengan PostgreSQL");
      }
    }
    if (currentStack.deployment === "Vercel" || currentStack.deployment === "Railway") {
      if (selectedTech === "Django REST" || selectedTech === "Spring Boot") {
        recommendations.push("Pertimbangkan serverless-compatible backend seperti Supabase atau Node.js API untuk deployment lebih mudah");
      }
    }
  }

  if (changedLayer === "database") {
    if (currentStack.backend === "Django REST" || currentStack.backend === "Spring Boot") {
      if (selectedTech !== "PostgreSQL" && selectedTech !== "MySQL") {
        recommendations.push("PostgreSQL atau MySQL adalah pilihan standar untuk Django dan Spring Boot");
      }
    }
    if (currentStack.backend === "Supabase") {
      if (selectedTech !== "Supabase Postgres") {
        recommendations.push("Supabase Postgres memberikan integrasi penuh dengan Supabase backend");
      }
    }
    if (currentStack.deployment === "Vercel") {
      if (selectedTech === "MongoDB") {
        recommendations.push("Pertimbangkan PostgreSQL atau Neon Postgres untuk kompatibilitas yang lebih baik dengan serverless");
      }
    }
  }

  if (changedLayer === "deployment") {
    if (currentStack.frontend === "Next.js") {
      if (selectedTech !== "Vercel" && selectedTech !== "Railway") {
        recommendations.push("Vercel adalah platform native untuk Next.js, Railway adalah alternatif yang baik");
      }
    }
    if (currentStack.backend === "Supabase") {
      if (selectedTech === "Vercel") {
        recommendations.push("Vercel + Supabase adalah kombinasi yang sangat populer untuk modern full-stack apps");
      }
    }
  }

  return recommendations;
}

interface AnalyzedRecommendation {
  stack: StackSelections;
  reasoning: string[];
  compatibilityScores: {
    frontend: CompatibilityScore;
    backend: CompatibilityScore;
    database: CompatibilityScore;
    deployment: CompatibilityScore;
  };
  overallScore: number;
}

function analyzeIdeaAndRecommend(idea: string): AnalyzedRecommendation {
  const lowerIdea = idea.toLowerCase();
  const reasoning: string[] = [];

  // Default stack
  const recommendedStack: StackSelections = {
    frontend: "Next.js",
    backend: "Supabase",
    database: "PostgreSQL",
    deployment: "Vercel",
  };

  // Analyze keywords and adjust recommendations
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
    blockchain: ["blockchain", "web3", "crypto", "nft", "smart contract", "defi", "wallet", "token"],
    social: ["social", "feed", "post", "comment", "like", "follow", "timeline", "stories", "profile"],
    streaming: ["video", "streaming", "livestream", "broadcast", "media", "upload", "transcoding"],
    saas: ["saas", "software", "subscription", "pricing", "plan", "billing", "tier"],
    membership: ["membership", "member", "subscription", "tier", "access", "premium", "exclusive"],
    portfolio: ["portfolio", "showcase", "projects", "work", "gallery", "resume", "cv", "personal"],
  };

  // Check for keywords
  const hasKeyword = (category: keyof typeof keywords) => {
    const categoryKeywords = keywords[category];
    if (!categoryKeywords) return false;
    return categoryKeywords.some((keyword) => lowerIdea.includes(keyword));
  };

  // Frontend recommendation
  if (hasKeyword("portfolio") || hasKeyword("mvp")) {
    recommendedStack.frontend = "Vue 3 + Vite";
    reasoning.push("Vue 3 + Vite: Fast development dengan learning curve rendah, cocok untuk portfolio/MVP");
  } else if (hasKeyword("mobile")) {
    recommendedStack.frontend = "React Native Web";
    reasoning.push("Mobile-first: React Native Web memungkinkan code sharing antara web dan mobile");
  } else if (hasKeyword("cms") || hasKeyword("ecommerce") || hasKeyword("saas") || hasKeyword("membership")) {
    recommendedStack.frontend = "Next.js";
    reasoning.push("Next.js: SSR/SSG untuk SEO, performance, dan dynamic content pada SaaS/e-commerce");
  } else if (hasKeyword("blockchain")) {
    recommendedStack.frontend = "React Native Web";
    reasoning.push("React Native Web: Compatible dengan Web3 libraries dan wallet integrations");
  } else if (hasKeyword("social") || hasKeyword("streaming")) {
    recommendedStack.frontend = "Next.js";
    reasoning.push("Next.js: Optimized rendering untuk dynamic social feeds dan media streaming");
  } else {
    recommendedStack.frontend = "Next.js";
    reasoning.push("Next.js: React framework paling populer dengan ekosistem besar");
  }

  // Backend recommendation
  if (hasKeyword("blockchain")) {
    recommendedStack.backend = "Go stdlib";
    reasoning.push("Go stdlib: Performance dan security tinggi untuk blockchain applications");
  } else if (hasKeyword("realTime") || hasKeyword("social") || hasKeyword("streaming")) {
    recommendedStack.backend = "Supabase";
    reasoning.push("Supabase: Real-time subscriptions bawaan untuk live/chat/streaming features");
  } else if (hasKeyword("ecommerce") || hasKeyword("saas") || hasKeyword("membership") || hasKeyword("auth")) {
    recommendedStack.backend = "Supabase";
    reasoning.push("Supabase: Auth, payments, dan database terintegrasi untuk SaaS/membership");
  } else if (hasKeyword("ai")) {
    recommendedStack.backend = "FastAPI";
    reasoning.push("FastAPI: Python framework yang ideal untuk AI/ML integration");
  } else if (hasKeyword("largeScale") || hasKeyword("api") || hasKeyword("dataHeavy")) {
    recommendedStack.backend = "Go Fiber";
    reasoning.push("Go Fiber: High-performance untuk scale besar, APIs, dan data processing");
  } else if (hasKeyword("mvp") || hasKeyword("portfolio")) {
    recommendedStack.backend = "Node.js API";
    reasoning.push("Node.js API: Simple dan fleksibel untuk MVP/portfolio development");
  } else {
    recommendedStack.backend = "Supabase";
    reasoning.push("Supabase: Backend-as-a-Service yang mempercepat development");
  }

  // Database recommendation
  if (hasKeyword("blockchain")) {
    recommendedStack.database = "PostgreSQL";
    reasoning.push("PostgreSQL: Reliable dan ACID compliant untuk blockchain transaction data");
  } else if (hasKeyword("social") || hasKeyword("streaming")) {
    recommendedStack.database = "MongoDB";
    reasoning.push("MongoDB: Flexible schema untuk social feeds, posts, dan media metadata");
  } else if (hasKeyword("realTime")) {
    recommendedStack.database = "Supabase Postgres";
    reasoning.push("Supabase Postgres: Real-time capabilities untuk live updates dan subscriptions");
  } else if (hasKeyword("ecommerce") || hasKeyword("saas") || hasKeyword("membership") || hasKeyword("largeScale")) {
    recommendedStack.database = "PostgreSQL";
    reasoning.push("PostgreSQL: ACID compliant dan reliable untuk transaksi, subscriptions, dan data penting");
  } else if (hasKeyword("dataHeavy")) {
    recommendedStack.database = "MongoDB";
    reasoning.push("MongoDB: Flexible schema untuk analytics data dan complex structures");
  } else if (hasKeyword("mvp") || hasKeyword("portfolio")) {
    recommendedStack.database = "SQLite";
    reasoning.push("SQLite: Zero-config database untuk MVP, portfolio, dan development");
  } else {
    recommendedStack.database = "PostgreSQL";
    reasoning.push("PostgreSQL: Database standar industry untuk kebanyakan use cases");
  }

  // Deployment recommendation
  if (hasKeyword("streaming") || hasKeyword("blockchain")) {
    recommendedStack.deployment = "Cloudflare";
    reasoning.push("Cloudflare: Edge network untuk global content delivery dan DDoS protection");
  } else if (hasKeyword("largeScale") || hasKeyword("saas") || hasKeyword("dataHeavy")) {
    recommendedStack.deployment = "AWS Amplify";
    reasoning.push("AWS Amplify: Scalable infrastructure untuk enterprise SaaS dan data-heavy apps");
  } else if (recommendedStack.frontend === "Next.js") {
    recommendedStack.deployment = "Vercel";
    reasoning.push("Vercel: Platform native untuk Next.js dengan zero-config deployment");
  } else if (hasKeyword("mvp") || hasKeyword("portfolio")) {
    recommendedStack.deployment = "Vercel";
    reasoning.push("Vercel: Free tier dan deployment mudah untuk MVP/portfolio");
  } else {
    recommendedStack.deployment = "Vercel";
    reasoning.push("Vercel: Modern deployment platform dengan excellent DX");
  }

  // Calculate compatibility scores for each layer
  const frontendScore = calculateCompatibility("frontend", recommendedStack.frontend, recommendedStack);
  const backendScore = calculateCompatibility("backend", recommendedStack.backend, recommendedStack);
  const databaseScore = calculateCompatibility("database", recommendedStack.database, recommendedStack);
  const deploymentScore = calculateCompatibility("deployment", recommendedStack.deployment, recommendedStack);

  const overallScore = Math.floor(
    (frontendScore.score + backendScore.score + databaseScore.score + deploymentScore.score) / 4
  );

  return {
    stack: recommendedStack,
    reasoning,
    compatibilityScores: {
      frontend: frontendScore,
      backend: backendScore,
      database: databaseScore,
      deployment: deploymentScore,
    },
    overallScore,
  };
}

export default function Home() {
  const router = useRouter();
  const sessionData = useSession() ?? { data: null, status: "loading", update: async () => null };
  const { data: session, status } = sessionData;
  const [userTier, setUserTier] = useState<string>("Freemium");

  // Fetch tier terbaru dari server (tidak mengandalkan cache session)
  useEffect(() => {
    async function fetchUserTier() {
      try {
        const response = await fetch("/api/auth/get-session", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          const tier = data?.user?.tier || "Freemium";
          setUserTier(tier);
        }
      } catch (error) {
        console.error("Error fetching user tier:", error);
      }
    }

    if (session) {
      fetchUserTier();
      fetchProjects();
      fetchUsage();
    }
  }, [session]);

  // Fetch projects dari API
  async function fetchProjects() {
    try {
      const response = await fetch("/api/projects", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }

  // Fetch usage data dari API
  async function fetchUsage() {
    try {
      const response = await fetch("/api/users/usage", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage || null);
      }
    } catch (error) {
      console.error("Error fetching usage:", error);
    }
  }

  const [screen, setScreen] = useState<Screen>("landing");
  const [idea, setIdea] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [techMode, setTechMode] = useState<TechMode>("auto");
  const [stack, setStack] = useState<StackSelections>({
    frontend: "Next.js",
    backend: "Node.js API",
    database: "PostgreSQL",
    deployment: "Vercel",
  });
  const [answers, setAnswers] = useState<QuestionState>({
    persona: "",
    firstOpen: [],
    coreFeatures: [],
    betterThanCurrent: [],
    returnReasons: [],
  });
  const [customAnswers, setCustomAnswers] = useState<CustomQuestionState>(createEmptyCustomAnswers);
  const [progress, setProgress] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [agentOpen, setAgentOpen] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Draft-nya udah kebaca. Mau kita tajemin scope MVP dulu atau rapihin user flow-nya?" },
  ]);
  const [, setChatLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [usage, setUsage] = useState<{ prdUsed: number; prdLimit: number; chatUsed: number; chatLimit: number; renewDate: string } | null>(null);
  const [stackModalOpen, setStackModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    layer: TechLayer;
    tech: string;
    score: CompatibilityScore;
  } | null>(null);

  const mergedAnswers = useMemo(() => mergeAnswersWithCustom(answers, customAnswers), [answers, customAnswers]);
  const markdown = useMemo(() => createMarkdown(idea, mergedAnswers, techMode, stack), [idea, mergedAnswers, stack, techMode]);
  const aiRecommendation = useMemo(() => analyzeIdeaAndRecommend(idea), [idea]);
  const [documentText, setDocumentText] = useState(markdown);

  useEffect(() => {
    setDocumentText(markdown);
  }, [markdown]);

  useEffect(() => {
    if (screen !== "generating") return;

    // Start real AI generation with streaming
    let streamContent = "";

    const startGeneration = async () => {
      try {
        const response = await fetch("/api/generate/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idea,
            answers: mergedAnswers,
            techMode,
            stack,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Generation failed");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        setProgress(10);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);

                if (parsed.error) {
                  toast.error(parsed.error);
                  setScreen("questions");
                  return;
                }

                if (parsed.chunk) {
                  streamContent += parsed.chunk;
                  setDocumentText(streamContent);

                  // Update progress based on content length
                  const progressValue = Math.min(10 + (streamContent.length / 20), 95);
                  setProgress(Math.round(progressValue));
                }

                if (parsed.done) {
                  setProgress(100);
                  setDocumentText(streamContent); // Ensure final content is set

                  // Auto-save project ke database setelah PRD selesai di-generate
                  try {
                    const saveResponse = await fetch("/api/projects", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: idea.substring(0, 100) || "Untitled Project",
                        initialIdea: idea || "No description",
                        answers: mergedAnswers,
                        techMode,
                        stack,
                        generatedPrd: streamContent,
                        status: "Generated",
                      }),
                    });
                    if (saveResponse.ok) {
                      const saveData = await saveResponse.json();
                      if (saveData.project?.id) {
                        setCurrentProjectId(saveData.project.id);
                      }
                    }
                  } catch (e) {
                    console.error("Failed to auto-save project:", e);
                  }

                  setTimeout(() => setScreen("result"), 500);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error) {
        console.error("Generation error:", error);
        toast.error(error instanceof Error ? error.message : "Generation failed");
        setScreen("questions");
      }
    };

    startGeneration();

    return () => {
      // Cleanup if needed
    };
  }, [screen, idea, mergedAnswers, techMode, stack]);

  function openProject(project: Project) {
    setIdea(project.summary);
    setHistoryOpen(false);
    setUserMenuOpen(false);
    setScreen("result");
    toast.success(project.title + " kebuka lagi. Lanjut gas dari sini.");
  }

  function createNewPlan() {
    setIdea("");
    setAnswers({
      persona: "",
      firstOpen: [],
      coreFeatures: [],
      betterThanCurrent: [],
      returnReasons: [],
    });
    setCustomAnswers(createEmptyCustomAnswers());
    setTechMode("auto");
    setHistoryOpen(false);
    setUserMenuOpen(false);
    setScreen("landing");
  }

  function continueFromLanding() {
    if (!idea.trim()) {
      toast.error("Lempar dulu idenya, baru kita racik bareng.");
      return;
    }

    setScreen("tech");
  }

  function continueFromQuestions() {
    if (!answers.persona.trim()) {
      toast.error("Jawaban pertama dulu ya, biar konteksnya ga kosong.");
      return;
    }

    setScreen("generating");
  }

  function toggleChip(key: QuestionListKey, value: string, limit?: number) {
    setAnswers((current) => {
      const existing = current[key];
      const filledCustomCount = customAnswers[key].filter((item) => item.value.trim()).length;

      if (existing.includes(value)) {
        return { ...current, [key]: existing.filter((item) => item !== value) };
      }

      if (limit && existing.length + filledCustomCount >= limit) {
        toast.error("Santai, maksimal " + limit + " item dulu buat bagian ini.");
        return current;
      }

      return { ...current, [key]: [...existing, value] };
    });
  }

  function addCustomField(key: QuestionListKey, limit?: number) {
    const selectedCount = answers[key].length;
    const filledCustomCount = customAnswers[key].filter((item) => item.value.trim()).length;
    const emptyCustomExists = customAnswers[key].some((item) => !item.value.trim());

    if (limit && selectedCount + filledCustomCount >= limit) {
      toast.error("Bagian ini cukup " + limit + " item dulu biar tetap fokus.");
      return;
    }

    if (emptyCustomExists) {
      toast.message("Field kosongnya masih ada. Isi dulu, baru nambah lagi.");
      return;
    }

    setCustomAnswers((current) => ({
      ...current,
      [key]: [
        ...current[key],
        { id: key + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7), value: "" },
      ],
    }));
  }

  function updateCustomField(key: QuestionListKey, id: string, value: string, limit?: number) {
    const filledOtherCustomCount = customAnswers[key].filter((item) => item.id !== id && item.value.trim()).length;
    const selectedCount = answers[key].length;
    const nextFilledCount = value.trim() ? 1 : 0;

    if (limit && selectedCount + filledOtherCustomCount + nextFilledCount > limit) {
      toast.error("Bagian ini maksimal " + limit + " item ya.");
      return;
    }

    setCustomAnswers((current) => ({
      ...current,
      [key]: current[key].map((item) => (item.id === id ? { ...item, value } : item)),
    }));
  }

  function removeCustomField(key: QuestionListKey, id: string) {
    setCustomAnswers((current) => ({
      ...current,
      [key]: current[key].filter((item) => item.id !== id),
    }));
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(documentText);
    toast.success("PRD-nya udah ke-copy. Tinggal tempel aja.");
  }

  function downloadMarkdown() {
    const blob = new Blob([documentText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "specflow-prd.md";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("File PRD beres. Tinggal simpan kalau mau.");
  }

  async function sendMessage() {
    if (!chatInput.trim()) return;

    const prompt = chatInput.trim();
    const userMessage = { role: "user" as const, content: prompt };

    // Add user message to chat
    setMessages((current) => [...current, userMessage]);
    setChatInput("");
    setChatLoading(true);
    setStreamingMessage("");

    try {
      // Add a placeholder assistant message for streaming
      const assistantId = Date.now().toString();
      setMessages((current) => [...current, { role: "assistant" as const, content: "", id: assistantId }]);

      // Pastikan user terautentikasi (session dari useSession hook)
      if (!session?.user?.id) {
        throw new Error("Not authenticated");
      }

      // Buat project jika belum ada (chat memerlukan projectId yang valid)
      let projectId = currentProjectId;
      if (!projectId) {
        try {
          const projectResponse = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: idea.substring(0, 100) || "Untitled Project",
              initialIdea: idea || "No description",
              answers: mergedAnswers,
              techMode,
              stack,
              generatedPrd: documentText,
              status: "Generated",
            }),
          });
          if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            projectId = projectData.project?.id || null;
            if (projectId) setCurrentProjectId(projectId);
          }
        } catch (e) {
          console.error("Failed to create project for chat:", e);
        }
      }

      if (!projectId) {
        throw new Error("Failed to initialize project for chat");
      }

      // Call streaming chat API (userId diambil dari session di server-side)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message: prompt,
          history: messages.filter((m) => m.role !== "system"),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chat failed");
      }

      // Process streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader?.read() || { done: true, value: null };
        if (done) break;

        buffer += decoder.decode(value || "", { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "user_message") {
                // User message confirmed
                continue;
              } else if (parsed.type === "chunk") {
                // Streaming chunk
                fullResponse += parsed.content;
                setStreamingMessage(fullResponse);

                // Update the placeholder message with streaming content
                setMessages((current) =>
                  current.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: fullResponse }
                      : msg
                  )
                );
              } else if (parsed.type === "done") {
                // Streaming complete
                setMessages((current) =>
                  current.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: fullResponse }
                      : msg
                  )
                );

                // Add to document as revision note
                setDocumentText((current) =>
                  current + "\n\n## AI Revision Note\n- " + prompt + "\n\n" + fullResponse
                );

                toast.success("Revisi selesai!");
              } else if (parsed.type === "error") {
                throw new Error(parsed.error || "Chat failed");
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Gagal mengirim pesan");

      // Remove the failed assistant message
      setMessages((current) => current.filter((msg) => msg.id !== streamingMessage));
    } finally {
      setChatLoading(false);
      setStreamingMessage("");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-3 py-4 text-foreground sm:px-6 sm:py-5">
      <BGPattern
        className="pointer-events-none opacity-70"
        fill="rgba(255,255,255,0.08)"
        mask="fade-center"
        size={26}
        variant="dots"
      />
      <div className={"mx-auto flex min-h-[calc(100vh-2.5rem)] w-full flex-col gap-4 sm:gap-6 " + (screen === "result" ? "max-w-[1880px]" : "max-w-full px-2 sm:px-6 lg:px-8")}>
        <Nav
          currentScreen={screen}
          historyOpen={historyOpen}
          onDashboard={() => router.push("/dashboard")}
          onHistory={() => setHistoryOpen((current) => !current)}
          onHome={() => setScreen("landing")}
          onOpenPricing={() => {
            setUserMenuOpen(false);
            router.push("/pricing");
          }}
          onOpenSettings={() => {
            setUserMenuOpen(false);
            router.push("/settings");
          }}
          onToggleUserMenu={() => setUserMenuOpen((current) => !current)}
          userMenuOpen={userMenuOpen}
          session={session}
          isPending={status === "loading"}
          userTier={userTier}
          usage={usage}
          onSignOut={async () => {
            await signOut();
            toast.success("Berhasil logout");
            setScreen("landing");
            router.push("/");
          }}
        />

        <div className="flex-1">
          {screen === "landing" && (
            <LandingScreen
              idea={idea}
              onChange={setIdea}
              onContinue={continueFromLanding}
              onOpenHistory={() => setHistoryOpen(true)}
            />
          )}

          {screen === "tech" && (
            <TechScreen
              stack={stack}
              techMode={techMode}
              aiRecommendation={aiRecommendation}
              onBack={() => setScreen("landing")}
              onContinue={() => setScreen("questions")}
              onModeChange={setTechMode}
              onStackChange={setStack}
              modalOpen={stackModalOpen}
              onModalChange={setStackModalOpen}
              modalData={modalData}
              onModalDataSet={setModalData}
            />
          )}

          {screen === "questions" && (
            <QuestionsScreen
              answers={answers}
              customAnswers={customAnswers}
              onAddCustomField={addCustomField}
              onBack={() => setScreen("tech")}
              onContinue={continueFromQuestions}
              onPersonaChange={(value) => setAnswers((current) => ({ ...current, persona: value }))}
              onRemoveCustomField={removeCustomField}
              onToggleChip={toggleChip}
              onUpdateCustomField={updateCustomField}
            />
          )}

          {screen === "generating" && <GeneratingScreen progress={progress} />}

          {screen === "result" && (
            <ResultScreen
              agentOpen={agentOpen}
              chatInput={chatInput}
              documentText={documentText}
              messages={messages}
              onCopy={copyMarkdown}
              onDownload={downloadMarkdown}
              onSend={sendMessage}
              setAgentOpen={setAgentOpen}
              setChatInput={setChatInput}
              setDocumentText={setDocumentText}
              setViewMode={setViewMode}
              viewMode={viewMode}
            />
          )}

          {screen === "dashboard" && <DashboardScreen onCreate={createNewPlan} onOpenProject={openProject} projects={projects} />}
        </div>
      </div>

      <PlanHistoryDrawer
        onCreate={createNewPlan}
        onOpenChange={setHistoryOpen}
        onOpenProject={openProject}
        open={historyOpen}
          projects={projects}
      />
      <PaywallDialog open={paywallOpen} onOpenChange={setPaywallOpen} onUpgrade={() => router.push("/pricing")} />
    </main>
  );
}

function Nav({
  currentScreen,
  historyOpen,
  onDashboard,
  onHistory,
  onHome,
  onOpenPricing,
  onOpenSettings,
  onToggleUserMenu,
  userMenuOpen,
  session,
  isPending,
  onSignOut,
  userTier,
  usage,
}: {
  currentScreen: Screen;
  historyOpen: boolean;
  onDashboard: () => void;
  onHistory: () => void;
  onHome: () => void;
  onOpenPricing: () => void;
  onOpenSettings: () => void;
  onToggleUserMenu: () => void;
  userMenuOpen: boolean;
  session?: ReturnType<typeof useSession>["data"];
  isPending?: boolean;
  onSignOut?: () => Promise<void>;
  userTier?: string;
  usage?: { prdUsed: number; prdLimit: number; chatUsed: number; chatLimit: number; renewDate: string } | null;
}) {
  const userData = getUserDisplayData(session, userTier, usage);
  const router = useRouter();
  const progressMap: Record<Exclude<Screen, "dashboard">, number> = {
    landing: 1,
    tech: 2,
    questions: 3,
    generating: 3,
    result: 4,
  };

  return (
    <header className="relative z-[90] rounded-full border border-white/10 bg-[#172231]/80 px-4 py-3 shadow-soft backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Menu button + Brand */}
        <div className="flex items-center gap-3">
          <Button aria-label="Buka histori plan" size="icon" variant="ghost" onClick={onHistory} className="sm:hidden xl:flex">
            <Menu className="h-5 w-5" />
          </Button>
          <button className="flex items-center gap-3" onClick={onHome}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary ring-1 ring-primary/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold tracking-[-0.04em] text-[#f7ecda]">SpecFlow</span>
          </button>
        </div>

        {/* Center: Progress indicators - only on tablet, hidden on desktop xl */}
        <div className="hidden items-center gap-2 sm:flex xl:hidden">
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={"h-1.5 w-8 rounded-full transition " + (
                currentScreen !== "dashboard" && progressMap[currentScreen as Exclude<Screen, "dashboard">] >= step
                  ? "bg-accent"
                  : "bg-white/10"
              )}
            />
          ))}
        </div>

        {/* Right: User info and actions */}
        <div className="flex items-center gap-2">
          {isPending ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
          ) : session ? (
            <>
              {/* Tier badge - hidden on small mobile, show on tablet and desktop */}
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {userData?.prdUsage}/{userData?.prdLimit}
              </Badge>

              {/* Dashboard button - hidden on mobile, show on tablet and desktop */}
              <Button variant="ghost" size="icon" className="hidden sm:flex" onClick={onDashboard}>
                <LayoutDashboard className="h-4 w-4" />
              </Button>

              {/* Notification bell - show for authenticated users */}
              <NotificationProvider />

              {/* Upgrade button - hidden on mobile, show on tablet and desktop */}
              <Button variant="accent" size="sm" className="hidden sm:inline-flex" onClick={onOpenPricing}>
                Upgrade
              </Button>

              {/* User menu button */}
              <div className="relative z-[95]">
                <button
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-2 pr-3 py-1.5 transition hover:bg-white/10"
                  onClick={onToggleUserMenu}
                >
                  <span className="hidden lg:inline-flex rounded-full bg-accent px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-accent-foreground">
                    {userData?.tier}
                  </span>
                  <span className="hidden md:inline-flex rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold text-primary">
                    + {userData?.chatCredits}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0d1522] text-sm font-bold text-foreground ring-1 ring-white/10">
                    {userData?.avatar}
                  </span>
                </button>

                {userMenuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+12px)] z-[120] w-72 overflow-hidden rounded-[22px] border border-white/10 bg-[#222c3d] p-0 shadow-[0_24px_80px_rgba(4,10,20,0.55)] backdrop-blur-xl">
                    <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0d1522] text-base font-bold text-foreground">
                        {userData?.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-foreground">{userData?.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{userData?.email}</p>
                      </div>
                    </div>

                    <div className="px-2 py-2">
                      <UserMenuButton icon={Settings} label="Pengaturan" onClick={onOpenSettings} />
                      <UserMenuButton icon={CreditCard} label="Lihat Paket" onClick={onOpenPricing} />
                      <UserMenuButton icon={HelpCircle} label="Butuh Bantuan?" onClick={() => toast.message("Pusat bantuan nyusul, tapi flow utamanya udah aman.")} />
                      <UserMenuButton icon={MoonStar} label="Mode Terang" onClick={() => toast.message("Mode terang belum dibuka di versi ini.")} />
                    </div>

                    <div className="border-t border-white/10 p-2">
                      <UserMenuButton icon={LogOut} label="Keluar Dulu" onClick={() => onSignOut?.()} />
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              {/* Non-authenticated state: Show Sign In and Sign Up buttons */}
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => router.push("/register")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Daftar
              </Button>
              <Button variant="accent" size="sm" onClick={() => router.push("/login")}>
                <LogIn className="mr-2 h-4 w-4" />
                Masuk
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function LandingScreen({
  idea,
  onChange,
  onContinue,
  onOpenHistory,
}: {
  idea: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onOpenHistory: () => void;
}) {
  return (
    <section className="flex min-h-[70vh] sm:min-h-[74vh] items-center justify-center px-4">
      <div className="mx-auto w-full max-w-[980px] text-center">
        <div className="mx-auto mb-6 sm:mb-8 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-emerald-500/14 text-emerald-300 ring-1 ring-emerald-500/20">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <h1 className="text-4xl font-bold leading-none tracking-[-0.05em] text-[#f7ecda] sm:text-5xl md:text-6xl lg:text-7xl">
          Lagi kepikiran bikin apa?
        </h1>
        <p className="mx-auto mt-3 sm:mt-4 max-w-xl px-4 text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground">
          Tumpahin idenya di sini. Nanti kita bantu rapihin biar pas dilempar ke AI tools hasilnya ga zonk.
        </p>

        <div className="mx-auto mt-6 sm:mt-10 max-w-[760px] rounded-[20px] sm:rounded-[28px] border border-white/10 bg-[#212b3c]/80 p-3 sm:p-4 shadow-soft">
          <Textarea
            className="min-h-[140px] sm:min-h-[170px] border-none bg-transparent px-2 py-2 text-base leading-8 text-[#f3e6d2] placeholder:text-slate-400 focus:ring-0"
            placeholder='Contoh: "App membership gym yang bisa urus check-in, paket langganan, sama reminder tagihan otomatis..."'
            value={idea}
            onChange={(event) => onChange(event.target.value)}
          />

          <div className="mt-3 flex items-center justify-between gap-2 sm:gap-4">
            <div className="hidden sm:block rounded-full border border-white/10 bg-[#182131] px-3 py-2 text-sm text-muted-foreground">
              Bahasa Indonesia
            </div>
            <Button className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl p-0 shrink-0" onClick={onContinue}>
              <SendHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        <button className="mt-6 sm:mt-8 text-sm font-semibold text-muted-foreground transition hover:text-foreground" onClick={onOpenHistory}>
          Intip draft yang pernah dibikin
        </button>
      </div>
    </section>
  );
}

function TechScreen({
  stack,
  techMode,
  aiRecommendation,
  onBack,
  onContinue,
  onModeChange,
  onStackChange,
  modalOpen,
  onModalChange,
  modalData,
  onModalDataSet,
}: {
  stack: StackSelections;
  techMode: TechMode;
  aiRecommendation: AnalyzedRecommendation;
  onBack: () => void;
  onContinue: () => void;
  onModeChange: (mode: TechMode) => void;
  onStackChange: (stack: StackSelections) => void;
  modalOpen: boolean;
  onModalChange: (open: boolean) => void;
  modalData: { layer: TechLayer; tech: string; score: CompatibilityScore } | null;
  onModalDataSet: (data: { layer: TechLayer; tech: string; score: CompatibilityScore } | null) => void;
}) {
  const stackCards = [
    { key: "frontend" as const, label: "Frontend", hint: "UI & tampilan user", icon: Code2, options: stackOptions.frontend },
    { key: "backend" as const, label: "Backend", hint: "Logic & API server", icon: Server, options: stackOptions.backend },
    { key: "database" as const, label: "Database", hint: "Penyimpanan data", icon: Database, options: stackOptions.database },
    { key: "deployment" as const, label: "Deployment", hint: "Hosting & infra", icon: Globe, options: stackOptions.deployment },
  ];

  return (
    <section className="mx-auto w-full max-w-[1180px]">
      <div className="mb-10 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-6xl font-bold tracking-[-0.055em] text-[#f7ecda]">Mau stack dipilihin atau ngatur sendiri?</h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-muted-foreground">
            Kalau udah punya bayangan, tinggal pilih. Kalau belum, biarin AI bantu cariin arah yang paling masuk akal.
          </p>
        </div>
        <button className="mt-5 text-sm font-semibold text-muted-foreground transition hover:text-foreground" onClick={onBack}>
          <ChevronLeft className="mr-1 inline h-4 w-4" />
          Balik
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <TechModeCard
          active={techMode === "auto"}
          description="Kalau belum pengen mikir terlalu teknis, tinggal serahin dulu ke AI biar dapet starting point yang waras."
          icon={Wand2}
          title="Biar AI yang nyari arah"
          onClick={() => onModeChange("auto")}
        />
        <TechModeCard
          active={techMode === "manual"}
          description="Kalau kamu udah punya preferensi, tinggal set sendiri dari awal biar lebih presisi."
          icon={Workflow}
          title="Aku mau ngatur sendiri"
          onClick={() => onModeChange("manual")}
        />
      </div>

      {techMode === "manual" ? (
        <div className="mt-10">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Atur teknologi per layer
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            {stackCards.map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.key} className="border-white/10 bg-[#212b3c]/82">
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-[#f7ecda]">{item.label}</h3>
                        <p className="text-sm text-muted-foreground">{item.hint}</p>
                      </div>
                    </div>
                    <Select
                      value={stack[item.key]}
                      onChange={(event) => {
                        const newTech = event.target.value;
                        const newStack = { ...stack, [item.key]: newTech };
                        onStackChange(newStack);
                        // Trigger modal with compatibility analysis
                        const score = calculateCompatibility(item.key, newTech, newStack);
                        onModalDataSet({ layer: item.key, tech: newTech, score });
                        onModalChange(true);
                      }}
                    >
                      {item.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="mt-10 border-white/10 bg-[#1b2635]/82">
          <CardContent className="p-6">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                🤖 AI Recommendation untuk Ide Anda
              </p>
              <h3 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#f7ecda]">
                {aiRecommendation.stack.frontend} + {aiRecommendation.stack.backend} + {aiRecommendation.stack.database} + {aiRecommendation.stack.deployment}
              </h3>
            </div>

            <div className="mb-6 space-y-2">
              {aiRecommendation.reasoning.map((reason, index) => (
                <div key={index} className="flex items-start gap-3 text-sm leading-6">
                  <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-[#f2e6d5]">{reason}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Frontend", tech: aiRecommendation.stack.frontend, score: aiRecommendation.compatibilityScores.frontend },
                { label: "Backend", tech: aiRecommendation.stack.backend, score: aiRecommendation.compatibilityScores.backend },
                { label: "Database", tech: aiRecommendation.stack.database, score: aiRecommendation.compatibilityScores.database },
                { label: "Deployment", tech: aiRecommendation.stack.deployment, score: aiRecommendation.compatibilityScores.deployment },
              ].map((item) => {
                const scoreColor = {
                  excellent: "text-emerald-400",
                  good: "text-green-400",
                  fair: "text-yellow-400",
                  warning: "text-orange-400",
                  incompatible: "text-red-400",
                }[item.score.level];

                const scoreBg = {
                  excellent: "bg-emerald-500/14 border-emerald-500/25",
                  good: "bg-green-500/14 border-green-500/25",
                  fair: "bg-yellow-500/14 border-yellow-500/25",
                  warning: "bg-orange-500/14 border-orange-500/25",
                  incompatible: "bg-red-500/14 border-red-500/25",
                }[item.score.level];

                return (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-[#f7ecda]">{item.tech}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className={"text-[10px] " + scoreBg + " " + scoreColor}>
                        {item.score.level}
                      </Badge>
                      <span className={"text-xs font-bold " + scoreColor}>{item.score.score}/100</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/8 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-accent">Overall Compatibility Score</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {aiRecommendation.overallScore >= 80
                      ? "Excellent! Stack ini sangat cocok untuk ide Anda."
                      : aiRecommendation.overallScore >= 60
                        ? "Good. Stack ini cocok untuk ide Anda dengan beberapa pertimbangan."
                        : "Fair. Ada beberapa trade-offs yang perlu dipertimbangkan."}
                  </p>
                </div>
                <div className="text-4xl font-bold text-accent">{aiRecommendation.overallScore}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-10 flex justify-end">
        <Button className="h-14 rounded-2xl px-10 text-base" variant="accent" onClick={onContinue}>
          Lanjutin
        </Button>
      </div>

      {/* Stack Compatibility Modal */}
      {modalData && (
        <StackCompatibilityModal
          open={modalOpen}
          onOpenChange={onModalChange}
          changedLayer={modalData.layer}
          selectedTech={modalData.tech}
          currentStack={stack}
          score={modalData.score}
        />
      )}
    </section>
  );
}

function TechModeCard({
  active,
  description,
  icon: Icon,
  title,
  onClick,
}: {
  active: boolean;
  description: string;
  icon: typeof Wand2;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      className={"rounded-[30px] border p-7 text-left transition " + (
        active
          ? "border-accent bg-[#241f2c] shadow-soft ring-1 ring-accent/20"
          : "border-white/10 bg-[#212b3c]/72 hover:bg-[#273245]"
      )}
      onClick={onClick}
    >
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-3xl font-bold text-[#f7ecda]">{title}</h3>
      <p className="mt-3 max-w-md text-lg leading-8 text-muted-foreground">{description}</p>
    </button>
  );
}

function QuestionsScreen({
  answers,
  customAnswers,
  onAddCustomField,
  onBack,
  onContinue,
  onPersonaChange,
  onRemoveCustomField,
  onToggleChip,
  onUpdateCustomField,
}: {
  answers: QuestionState;
  customAnswers: CustomQuestionState;
  onAddCustomField: (key: QuestionListKey, limit?: number) => void;
  onBack: () => void;
  onContinue: () => void;
  onPersonaChange: (value: string) => void;
  onRemoveCustomField: (key: QuestionListKey, id: string) => void;
  onToggleChip: (key: QuestionListKey, value: string, limit?: number) => void;
  onUpdateCustomField: (key: QuestionListKey, id: string, value: string, limit?: number) => void;
}) {
  return (
    <section className="mx-auto w-full max-w-[1240px]">
      <div className="flex items-start justify-between gap-5">
        <div>
          <h1 className="text-6xl font-bold tracking-[-0.055em] text-[#f7ecda]">Biar idenya makin kebaca</h1>
          <p className="mt-3 text-lg leading-8 text-muted-foreground">
            Jawab singkat juga gapapa. Yang penting kita dapet konteks yang cukup biar draft-nya ga ngawang.
          </p>
        </div>
        <div className="pt-5 text-right text-sm font-semibold text-muted-foreground">
          <div>0/5</div>
        </div>
      </div>

      <div className="mt-10 space-y-10">
        <QuestionBlock number={1} prompt="Siapa yang paling butuh produk ini, dan sekarang mereka masih ngakalinnya pakai cara apa?">
          <Textarea
            className="min-h-[110px] bg-transparent"
            placeholder="Ceritain versi singkatnya di sini..."
            value={answers.persona}
            onChange={(event) => onPersonaChange(event.target.value)}
          />
        </QuestionBlock>

        <QuestionBlock number={2} prompt="Pas pertama kali buka, hal apa yang wajib berhasil mereka lakuin?">
          <ChipGroup
            customFields={customAnswers.firstOpen}
            selected={answers.firstOpen}
            values={starterQuestions.firstOpen}
            onAddCustom={() => onAddCustomField("firstOpen")}
            onRemoveCustom={(id) => onRemoveCustomField("firstOpen", id)}
            onToggle={(value) => onToggleChip("firstOpen", value)}
            onUpdateCustom={(id, value) => onUpdateCustomField("firstOpen", id, value)}
          />
        </QuestionBlock>

        <QuestionBlock number={3} prompt="Kalau disaring jadi yang paling inti, fitur mana aja yang wajib banget ada? (Pilih 3)">
          <ChipGroup
            customFields={customAnswers.coreFeatures}
            selected={answers.coreFeatures}
            values={starterQuestions.coreFeatures}
            onAddCustom={() => onAddCustomField("coreFeatures", 3)}
            onRemoveCustom={(id) => onRemoveCustomField("coreFeatures", id)}
            onToggle={(value) => onToggleChip("coreFeatures", value, 3)}
            onUpdateCustom={(id, value) => onUpdateCustomField("coreFeatures", id, value, 3)}
          />
        </QuestionBlock>

        <QuestionBlock number={4} prompt="Kenapa orang bakal milih ini dibanding cara mereka sekarang?">
          <ChipGroup
            customFields={customAnswers.betterThanCurrent}
            selected={answers.betterThanCurrent}
            values={starterQuestions.betterThanCurrent}
            onAddCustom={() => onAddCustomField("betterThanCurrent")}
            onRemoveCustom={(id) => onRemoveCustomField("betterThanCurrent", id)}
            onToggle={(value) => onToggleChip("betterThanCurrent", value)}
            onUpdateCustom={(id, value) => onUpdateCustomField("betterThanCurrent", id, value)}
          />
        </QuestionBlock>

        <QuestionBlock number={5} prompt="Apa yang bikin orang pengen balik lagi pake produk ini?">
          <ChipGroup
            customFields={customAnswers.returnReasons}
            selected={answers.returnReasons}
            values={starterQuestions.returnReasons}
            onAddCustom={() => onAddCustomField("returnReasons")}
            onRemoveCustom={(id) => onRemoveCustomField("returnReasons", id)}
            onToggle={(value) => onToggleChip("returnReasons", value)}
            onUpdateCustom={(id, value) => onUpdateCustomField("returnReasons", id, value)}
          />
        </QuestionBlock>
      </div>

      <div className="mt-12 flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Balik
        </Button>
        <Button className="h-14 rounded-2xl px-9 text-base" variant="accent" onClick={onContinue}>
          Rakit PRD
        </Button>
      </div>
    </section>
  );
}

function QuestionBlock({
  children,
  number,
  prompt,
}: {
  children: React.ReactNode;
  number: number;
  prompt: string;
}) {
  return (
    <div className="border-b border-white/10 pb-9">
      <div className="mb-5 flex items-start justify-between gap-5">
        <h2 className="max-w-4xl text-2xl font-semibold leading-10 text-[#f7ecda]">
          {number}. {prompt}
        </h2>
        <span className="text-sm font-semibold text-muted-foreground">Skip dulu</span>
      </div>
      {children}
    </div>
  );
}

function ChipGroup({
  customFields,
  selected,
  values,
  onAddCustom,
  onRemoveCustom,
  onToggle,
  onUpdateCustom,
}: {
  customFields: CustomQuestionField[];
  selected: string[];
  values: string[];
  onAddCustom: () => void;
  onRemoveCustom: (id: string) => void;
  onToggle: (value: string) => void;
  onUpdateCustom: (id: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {values.map((value) => {
          const active = selected.includes(value);

          return (
            <button
              key={value}
              className={"rounded-full border px-4 py-3 text-base transition " + (
                active
                  ? "border-primary/50 bg-primary/12 text-primary"
                  : "border-white/10 bg-transparent text-[#f3e7d7] hover:bg-white/5"
              )}
              onClick={() => onToggle(value)}
            >
              {value}
            </button>
          );
        })}
        <button
          className="rounded-full border border-primary/45 bg-primary/8 px-4 py-3 text-base font-medium text-primary transition hover:bg-primary/14"
          onClick={onAddCustom}
        >
          + Tambahin sendiri
        </button>
      </div>

      {customFields.length ? (
        <div className="space-y-3">
          {customFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-3">
              <Input
                className="h-12 rounded-2xl bg-white/5"
                placeholder={"Tulis jawaban tambahan " + (index + 1) + "..."}
                value={field.value}
                onChange={(event) => onUpdateCustom(field.id, event.target.value)}
              />
              <Button
                className="h-12 w-12 rounded-2xl"
                size="icon"
                type="button"
                variant="ghost"
                onClick={() => onRemoveCustom(field.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function GeneratingScreen({ progress }: { progress: number }) {
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-[980px] items-center">
      <Card className="w-full border-white/10 bg-[#1b2635]/82">
        <CardContent className="grid gap-10 p-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <Badge variant="accent">Lagi diracik</Badge>
            <h2 className="mt-5 text-6xl font-bold leading-none tracking-[-0.055em] text-[#f7ecda]">
              Kita lagi ngebentuk ide ini jadi PRD yang beneran kepake.
            </h2>
            <p className="mt-5 text-base leading-8 text-muted-foreground">
              Dari ide mentah, konteks, sampai arah stack, semuanya lagi disusun biar output akhirnya ga cuma keren, tapi jelas.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#141f2d] p-6">
            <Progress className="mb-6" value={progress} />
            <div className="space-y-4">
              {["Ngambil benang merah idenya", "Nyusun requirement inti", "Nyocokin stack yang paling pas", "Ngebentuk preview dokumen"].map((item, index) => (
                <div key={item} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                    {progress > index * 20 + 18 ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className="font-semibold text-[#f7ecda]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function ResultScreen({
  agentOpen,
  chatInput,
  documentText,
  messages,
  onCopy,
  onDownload,
  onSend,
  setAgentOpen,
  setChatInput,
  setDocumentText,
  setViewMode,
  viewMode,
}: {
  agentOpen: boolean;
  chatInput: string;
  documentText: string;
  messages: { role: string; content: string }[];
  onCopy: () => void;
  onDownload: () => void;
  onSend: () => void;
  setAgentOpen: (open: boolean) => void;
  setChatInput: (value: string) => void;
  setDocumentText: (value: string) => void;
  setViewMode: (mode: ViewMode) => void;
  viewMode: ViewMode;
}) {
  const outline = extractHeadings(documentText);
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className={"grid min-h-[78vh] gap-5 " + (agentOpen ? "xl:grid-cols-[290px_minmax(0,1.4fr)_380px]" : "xl:grid-cols-[290px_minmax(0,1fr)]")}>
      <Card className="hidden self-start border-white/10 bg-[#172231]/86 xl:sticky xl:top-5 xl:block">
        <CardContent className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">PRD Outline</p>
          <div className="mt-5 space-y-2">
            {outline.map((item) => (
              <button
                key={item.id}
                className="w-full rounded-2xl border border-transparent px-3 py-3 text-left text-sm leading-6 text-muted-foreground transition hover:border-white/10 hover:bg-white/5 hover:text-[#f7ecda]"
                onClick={() => scrollToSection(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-4">
        <Card className="border-white/10 bg-[#172231]/86">
          <CardContent className="flex flex-wrap items-start justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">PRD Workspace</p>
              <h2 className="text-4xl font-bold tracking-[-0.045em] text-[#f7ecda]">Dokumen spesifikasi yang siap direview</h2>
            </div>
            <div className="flex flex-col items-end gap-3 self-start">
              <Tabs>
                <TabsList>
                  <TabsTrigger active={viewMode === "preview"} onClick={() => setViewMode("preview")}>
                    Preview
                  </TabsTrigger>
                  <TabsTrigger active={viewMode === "edit"} onClick={() => setViewMode("edit")}>
                    Edit Markdown
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button variant="outline" onClick={onCopy}>
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" onClick={onDownload}>
                  <Download className="h-4 w-4" />
                  Export .md
                </Button>
                <Button variant={agentOpen ? "default" : "outline"} onClick={() => setAgentOpen(!agentOpen)}>
                  {agentOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                  AI Review
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#172231]/86">
          <CardContent className="max-h-[calc(100vh-12rem)] overflow-auto p-7">
            {viewMode === "preview" ? (
              <article className="prose-spec max-w-none">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => {
                      const headingText = Children.toArray(children).join("");
                      const id = headingText
                        .toLowerCase()
                        .replace(/[^\w\s-]/g, "")
                        .trim()
                        .replace(/\s+/g, "-");

                      return (
                        <h2 id={id}>
                          {children}
                        </h2>
                      );
                    },
                  }}
                >
                  {documentText}
                </ReactMarkdown>
              </article>
            ) : (
              <Textarea className="min-h-[780px] font-mono text-sm" value={documentText} onChange={(event) => setDocumentText(event.target.value)} />
            )}
          </CardContent>
        </Card>
      </div>

      <aside
        className={"fixed inset-y-0 right-0 z-40 w-full max-w-[340px] border-l border-white/10 bg-[#142030]/95 shadow-soft backdrop-blur transition-transform duration-300 xl:static xl:w-auto xl:max-w-none xl:rounded-[1.5rem] xl:border " + (
          agentOpen ? "translate-x-0" : "translate-x-full xl:hidden"
        )}
      >
        <div className="flex h-full flex-col p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Badge variant="accent">Review panel</Badge>
              <h3 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-[#f7ecda]">AI review workspace</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Pakai panel ini buat minta refinement, penajaman scope MVP, atau revisi struktur tanpa keluar dari workspace.
              </p>
            </div>
            <Button className="xl:hidden" size="icon" variant="ghost" onClick={() => setAgentOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Card className="mb-4 border-white/10 bg-white/5">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">System flow snapshot</p>
              <pre className="mt-3 overflow-auto rounded-2xl border border-white/10 bg-[#111826] p-4 text-xs leading-6 text-slate-300">
                {mermaidDiagram}
              </pre>
            </CardContent>
          </Card>

          <Separator className="bg-white/10" />

          <div className="flex-1 space-y-3 overflow-auto py-4">
            {messages.map((message, index) => (
              <div
                key={message.role + "-" + index}
                className={"rounded-2xl p-4 text-sm leading-7 " + (
                  message.role === "assistant"
                    ? "border border-white/10 bg-white/5 text-[#efe2cf]"
                    : "bg-primary/14 text-primary ring-1 ring-primary/20"
                )}
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Textarea
              className="min-h-28"
              placeholder="Contoh: bikin versi MVP-nya lebih simpel, tambahin edge case, atau rapihin bagian user flow..."
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
            />
            <Button className="w-full rounded-2xl" onClick={onSend}>
              <MessageSquareText className="h-4 w-4" />
              Kirim catatan
            </Button>
          </div>
        </div>
      </aside>
    </section>
  );
}

function DashboardScreen({
  onCreate,
  onOpenProject,
  projects,
}: {
  onCreate: () => void;
  onOpenProject: (project: Project) => void;
  projects: Project[];
}) {
  return (
    <section className="mx-auto max-w-[1280px]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Riwayat racikan</p>
          <h1 className="mt-3 text-6xl font-bold tracking-[-0.055em] text-[#f7ecda]">Semua ide yang pernah kamu olah</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-muted-foreground">
            Mau lanjut dari draft lama, bandingin arah ide, atau sekadar nginget hasil kemarin, semua nongkrong di sini.
          </p>
        </div>
        <Button className="rounded-2xl px-8" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Racik Baru
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="border-white/10 bg-[#1b2635]/82">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Plus className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-[#f7ecda]">Belum ada project</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              Ide pertama kamu belum ada di sini. Mulai racik PRD sekarang biar hasilnya tersimpan dan bisa dibuka lagi.
            </p>
            <Button className="mt-6 rounded-2xl px-8" variant="accent" onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Racik PRD Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="border-white/10 bg-[#1b2635]/82 transition hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="secondary">{project.tier}</Badge>
                  <span className="text-xs font-semibold text-muted-foreground">{project.updatedAt}</span>
                </div>
                <CardTitle className="text-[#f7ecda]">{project.title}</CardTitle>
                <CardDescription className="leading-7">{project.summary}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
                  {project.status}
                </div>
                <Button className="w-full rounded-2xl" onClick={() => onOpenProject(project)}>
                  Buka Lagi
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function PlanHistoryDrawer({
  onCreate,
  onOpenChange,
  onOpenProject,
  open,
  projects,
}: {
  onCreate: () => void;
  onOpenChange: (open: boolean) => void;
  onOpenProject: (project: Project) => void;
  open: boolean;
  projects: Project[];
}) {
  return (
    <div className={"fixed inset-0 z-[100] transition " + (open ? "pointer-events-auto" : "pointer-events-none")}>
      <button
        aria-label="Tutup histori plan"
        className={"absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity " + (open ? "opacity-100" : "opacity-0")}
        onClick={() => onOpenChange(false)}
      />
      <aside
        className={"absolute bottom-0 left-0 top-0 w-[min(85vw,320px)] sm:w-[min(92vw,360px)] border-r border-white/10 bg-[#172231] text-[#f4ead8] shadow-soft transition-transform duration-300 " + (
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col pt-16">
          <div className="flex items-center justify-between px-5 pb-5">
            <div>
              <h2 className="text-lg font-bold">Riwayat Draft</h2>
              <p className="mt-1 text-sm text-muted-foreground">Semua ide yang pernah kamu utak-atik nongkrong di sini.</p>
            </div>
            <Button aria-label="Tutup menu" size="icon" variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <Separator className="my-5 bg-white/10" />

          <section className="flex-1 overflow-auto px-5 pb-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="sm font-bold">Draft Punya Kamu</h3>
              <button className="flex items-center gap-1 text-sm font-semibold text-slate-300 transition hover:text-primary" onClick={onCreate}>
                <Plus className="h-4 w-4" />
                Baru
              </button>
            </div>

            <div className="space-y-3">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className="block w-full rounded-2xl p-3 text-left transition hover:bg-white/5"
                  onClick={() => onOpenProject(project)}
                >
                  <span className="line-clamp-2 block text-sm font-bold leading-5 text-slate-100">{project.title}</span>
                  <span className="mt-1 block text-xs font-medium text-slate-400">{project.updatedAt}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function UserMenuButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Settings;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-white/5"
      onClick={onClick}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </button>
  );
}

function StackCompatibilityModal({
  open,
  onOpenChange,
  changedLayer,
  selectedTech,
  currentStack,
  score,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changedLayer: TechLayer;
  selectedTech: string;
  currentStack: StackSelections;
  score: CompatibilityScore;
}) {
  const levelColor = {
    excellent: "text-emerald-400",
    good: "text-green-400",
    fair: "text-yellow-400",
    warning: "text-orange-400",
    incompatible: "text-red-400",
  }[score.level];

  const levelBg = {
    excellent: "bg-emerald-500/14 border-emerald-500/25",
    good: "bg-green-500/14 border-green-500/25",
    fair: "bg-yellow-500/14 border-yellow-500/25",
    warning: "bg-orange-500/14 border-orange-500/25",
    incompatible: "bg-red-500/14 border-red-500/25",
  }[score.level];

  const recommendations = getRecommendations(changedLayer, selectedTech, currentStack);
  const showRecommendations = score.level === "fair" || score.level === "warning" || score.level === "incompatible" || score.score < 60;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#172231] text-[#f7ecda]" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Badge className={levelBg + " " + levelColor}>
              {score.level.toUpperCase()}
            </Badge>
            <Badge variant="secondary">{score.score}/100</Badge>
          </div>
          <DialogTitle className="mt-3">
            Analisis Kompatibilitas: {selectedTech}
          </DialogTitle>
          <DialogDescription>
            {score.explanation}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {score.warnings && score.warnings.length > 0 && (
            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/8 p-4">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
                ⚠️ Perhatian
              </p>
              <ul className="space-y-2 text-sm text-orange-300">
                {score.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {score.pros.length > 0 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">
                ✅ Kelebihan
              </p>
              <ul className="space-y-2 text-sm text-emerald-300">
                {score.pros.map((pro, index) => (
                  <li key={index}>• {pro}</li>
                ))}
              </ul>
            </div>
          )}

          {score.cons.length > 0 && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-4">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-red-400">
                ❌ Kekurangan
              </p>
              <ul className="space-y-2 text-sm text-red-300">
                {score.cons.map((con, index) => (
                  <li key={index}>• {con}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Stack Saat Ini
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Frontend:</span>
                <span className="ml-2 text-[#f7ecda]">{currentStack.frontend}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Backend:</span>
                <span className="ml-2 text-[#f7ecda]">{currentStack.backend}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Database:</span>
                <span className="ml-2 text-[#f7ecda]">{currentStack.database}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Deployment:</span>
                <span className="ml-2 text-[#f7ecda]">{currentStack.deployment}</span>
              </div>
            </div>
          </div>

          {showRecommendations && recommendations.length > 0 && (
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/8 p-4">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
                💡 Rekomendasi Lebih Baik
              </p>
              <ul className="space-y-2 text-sm text-blue-300">
                {recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Button className="mt-6 w-full rounded-2xl" onClick={() => onOpenChange(false)}>
          Mengerti
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function PaywallDialog({
  open,
  onOpenChange,
  onUpgrade,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#172231] text-[#f7ecda]" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <Badge className="w-fit" variant="accent">
            Mau lebih leluasa?
          </Badge>
          <DialogTitle>Buka akses yang lebih lega buat export, revisi, dan workflow yang lebih ngebut.</DialogTitle>
          <DialogDescription>
            Upgrade paket untuk membuka fitur lengkap dan kuota yang lebih besar.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 grid gap-3">
          {[
            ["Freemium", "Buat ngetes flow awal sampai tahap eksplorasi dan validasi konteks"],
            ["Starter", "Buat 5 PRD per bulan, 100 chat revisi, plus export yang lebih lengkap"],
            ["Pro", "Buat generate dan revisi tanpa batas selama langganan lagi aktif"],
          ].map(([tier, detail]) => (
            <div key={tier} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
              <div>
                <p className="font-semibold text-[#f7ecda]">{tier}</p>
                <p className="text-sm text-muted-foreground">{detail}</p>
              </div>
              <Badge variant="secondary">{tier}</Badge>
            </div>
          ))}
        </div>
        <Button className="mt-6 w-full rounded-2xl" variant="accent" onClick={() => {
          onOpenChange(false);
          onUpgrade?.();
        }}>
          Lihat Paket
        </Button>
      </DialogContent>
    </Dialog>
  );
}

