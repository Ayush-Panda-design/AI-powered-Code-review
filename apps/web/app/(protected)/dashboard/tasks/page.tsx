import Link from "next/link";

import { ProjectPicker } from "@/features/dashboard/components/project-picker";
import { TaskBoard } from "@/features/shipflow/components/task-board";
import { ensureWorkspaceAction } from "@/lib/actions/shipflow";
import { getActiveProjectForWorkspace } from "@/lib/active-project";
import { cn } from "@/lib/utils";
import { listProjects } from "@repo/services";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ featureId?: string; project?: string }>;
}) {
  const workspace = await ensureWorkspaceAction();
  const { featureId, project: projectParam } = await searchParams;

  const [projects, defaultProject] = await Promise.all([
    listProjects(workspace.id),
    getActiveProjectForWorkspace(workspace.id),
  ]);

  const activeProject = projectParam
    ? (projects.find((p) => p.id === projectParam) ?? defaultProject)
    : defaultProject;

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Task board</h1>
        <p className="text-sm text-muted-foreground">
          Create a project first to see tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          {featureId ? (
            <Link
              href={`/dashboard/feature-requests/${featureId}`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to feature
            </Link>
          ) : null}
          <h1 className={cn("text-2xl font-semibold tracking-tight", featureId && "mt-2")}>
            Task board
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Engineering tasks from approved requirements — move cards across columns as work progresses.
          </p>
        </div>
        <ProjectPicker
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          activeProjectId={activeProject.id}
        />
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Create a project first to see tasks.
        </p>
      ) : (
        <TaskBoard
          projectId={activeProject.id}
          fromFeatureId={featureId}
        />
      )}
    </div>
  );
}
