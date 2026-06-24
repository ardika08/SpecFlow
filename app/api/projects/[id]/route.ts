import { NextRequest, NextResponse } from "next/server";
import { db, projects } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";

// GET /api/projects/[id] - Get a single project
//
// Auth: Session diverifikasi. Hanya owner project yang bisa melihat.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = await (db as any).select().from(projects).where(eq(projects.id, id)).get();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verifikasi ownership
    if (project.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse JSON fields
    const parsedProject = {
      ...project,
      answers: project.answers ? JSON.parse(project.answers) : null,
      stack: project.stack ? JSON.parse(project.stack) : null,
    };

    return NextResponse.json({ project: parsedProject });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update a project
//
// Auth: Session diverifikasi. Hanya owner project yang bisa update.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, initialIdea, answers, techMode, stack, generatedPrd, status } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingProject = await (db as any).select().from(projects).where(eq(projects.id, id)).get();
    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verifikasi ownership
    if (existingProject.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, string | Date> = {};
    if (title !== undefined) updateData.title = title;
    if (initialIdea !== undefined) updateData.initialIdea = initialIdea;
    if (answers !== undefined) updateData.answers = JSON.stringify(answers);
    if (techMode !== undefined) updateData.techMode = techMode;
    if (stack !== undefined) updateData.stack = JSON.stringify(stack);
    if (generatedPrd !== undefined) updateData.generatedPrd = generatedPrd;
    if (status !== undefined) updateData.status = status;
    updateData.updatedAt = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).update(projects).set(updateData).where(eq(projects.id, id)).run();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedProject = await (db as any).select().from(projects).where(eq(projects.id, id)).get();

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete a project
//
// Auth: Session diverifikasi. Hanya owner project yang bisa delete.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingProject = await (db as any).select().from(projects).where(eq(projects.id, id)).get();
    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verifikasi ownership
    if (existingProject.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).delete(projects).where(eq(projects.id, id)).run();

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
