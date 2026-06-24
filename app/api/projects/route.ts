import { NextRequest, NextResponse } from "next/server";
import { db, projects, users } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSessionUser } from "@/lib/auth/session";

// GET /api/projects - Get all projects for the authenticated user
//
// Auth: Session diverifikasi. userId diambil dari session, bukan query param.
export async function GET(request: NextRequest) {
  try {
    const { user } = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userProjects = await (db as any)
      .select({
        id: projects.id,
        title: projects.title,
        status: projects.status,
        tier: projects.tier,
        updatedAt: projects.updatedAt,
        initialIdea: projects.initialIdea,
      })
      .from(projects)
      .where(eq(projects.userId, user.id))
      .orderBy(desc(projects.updatedAt));

    return NextResponse.json({
      projects: userProjects.map((p: { id: string; title: string; status: string; tier: string; updatedAt: Date; initialIdea?: string | null }) => {
        const idea = p.initialIdea || "";
        const summary = idea.length > 150 ? idea.substring(0, 150) + "..." : idea;
        return {
          id: p.id,
          title: p.title,
          status: p.status,
          tier: p.tier,
          updatedAt: new Date(p.updatedAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          summary: summary || "No description",
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
//
// Auth: Session diverifikasi. userId diambil dari session, bukan dari body.
export async function POST(request: NextRequest) {
  try {
    const { user } = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, initialIdea, answers, techMode, stack, generatedPrd, status } = body;

    if (!title || !initialIdea) {
      return NextResponse.json({ error: "Missing required fields: title, initialIdea" }, { status: 400 });
    }

    // Fetch user tier from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbUser = await (db as any).select().from(users).where(eq(users.id, user.id)).get();
    const userTier = dbUser?.tier || "Freemium";

    const projectId = nanoid();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newProject = await (db as any)
      .insert(projects)
      .values({
        id: projectId,
        userId: user.id,
        title: title.substring(0, 100),
        initialIdea,
        answers: answers ? JSON.stringify(answers) : null,
        techMode: techMode || "auto",
        stack: stack ? JSON.stringify(stack) : null,
        generatedPrd: generatedPrd || null,
        status: status || "Draft",
        tier: userTier,
      })
      .returning()
      .get();

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
