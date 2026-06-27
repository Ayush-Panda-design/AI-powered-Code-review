import { ProjectPicker } from "@/features/dashboard/components/project-picker";
import { TaskBoard } from "@/features/shipflow/components/task-board";
import { ensureWorkspaceAction } from "@/lib/actions/shipflow";
import { getActiveProjectForWorkspace } from "@/lib/active-project";
import { listProjects } from "@repo/services";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const workspace = await ensureWorkspaceAction();
  const [projects, activeProject] = await Promise.all([
    listProjects(workspace.id),
    getActiveProjectForWorkspace(workspace.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Task board</h1>
          <p className="text-sm text-muted-foreground">
            Engineering tasks from approved PRDs, organized by status
          </p>
        </div>
        <ProjectPicker
          projects={projects.map((project) => ({
            id: project.id,
            name: project.name,
          }))}
          activeProjectId={activeProject.id}
        />
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Create a project first to see tasks.
        </p>
      ) : (
        <TaskBoard projectId={activeProject.id} />
      )}
    </div>
  );
}
