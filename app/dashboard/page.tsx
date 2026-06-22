"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BGPattern } from "@/components/ui/bg-pattern";
import { Navbar } from "@/components/navbar";
import { useSession } from "@/lib/hooks";

type Tier = "Freemium" | "Starter" | "Pro";

type Project = {
  id: string;
  title: string;
  status: "Draft" | "Generated" | "Needs review";
  tier: Tier;
  updatedAt: string;
  summary: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session && !isPending) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchProjects();
    }
  }, [session]);

  async function fetchProjects() {
    try {
      if (!session?.user?.id) {
        throw new Error("No user session");
      }
      const response = await fetch(`/api/projects`);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  function createNewPlan() {
    router.push("/?screen=landing");
  }

  function openProject(project: Project) {
    // Store selected project in sessionStorage or navigate to result page
    sessionStorage.setItem("selectedProject", JSON.stringify(project));
    router.push(`/?screen=result&project=${project.id}`);
    toast.success(project.title + " kebuka lagi. Lanjut gas dari sini.");
  }

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden px-3 py-4 text-foreground sm:px-6 sm:py-5">
        <BGPattern
          className="pointer-events-none opacity-70"
          fill="rgba(255,255,255,0.08)"
          mask="fade-center"
          size={26}
          variant="dots"
        />
        <div className="mx-auto flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            <p className="mt-4 text-muted-foreground">Memuat riwayat proyek...</p>
          </div>
        </div>
      </main>
    );
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
      <div className="mx-auto max-w-[1280px]">
        <Navbar />
        {/* Dashboard Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Riwayat racikan
            </p>
            <h1 className="mt-3 text-6xl font-bold tracking-[-0.055em] text-[#f7ecda]">
              Semua ide yang pernah kamu olah
            </h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-muted-foreground">
              Mau lanjut dari draft lama, bandingin arah ide, atau sekadar nginget hasil kemarin, semua
              nongkrong di sini.
            </p>
          </div>
          <Button className="rounded-2xl px-8" onClick={createNewPlan}>
            <Plus className="mr-2 h-4 w-4" />
            Racik Baru
          </Button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-[#f7ecda]">Belum ada proyek</h3>
              <p className="mt-2 text-muted-foreground">
                Mulai dengan membuat PRD pertamamu hari ini.
              </p>
              <Button className="mt-4" onClick={createNewPlan}>
                <Plus className="mr-2 h-4 w-4" />
                Buat Proyek Baru
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onOpen={openProject} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function ProjectCard({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: (project: Project) => void;
}) {
  const statusColor = {
    Draft: "bg-slate-500/14 text-slate-300 border-slate-500/25",
    Generated: "bg-emerald-500/14 text-emerald-300 border-emerald-500/25",
    "Needs review": "bg-amber-500/14 text-amber-300 border-amber-500/25",
  }[project.status];

  const tierColor = {
    Freemium: "bg-slate-500/14 text-slate-300 border-slate-500/25",
    Starter: "bg-blue-500/14 text-blue-300 border-blue-500/25",
    Pro: "bg-purple-500/14 text-purple-300 border-purple-500/25",
  }[project.tier];

  return (
    <Card className="border-white/10 bg-[#1b2635]/82 transition hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary" className={tierColor}>
            {project.tier}
          </Badge>
          <span className="text-xs font-semibold text-muted-foreground">{project.updatedAt}</span>
        </div>
        <CardTitle className="text-[#f7ecda]">{project.title}</CardTitle>
        <CardDescription className="leading-7">{project.summary}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={"mb-4 rounded-2xl border px-4 py-3 text-sm " + statusColor}>
          {project.status}
        </div>
        <Button className="w-full rounded-2xl" onClick={() => onOpen(project)}>
          Buka Lagi
        </Button>
      </CardContent>
    </Card>
  );
}
