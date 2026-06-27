import { TaskBoard } from "@/features/shipflow/components/task-board";
import { ensureWorkspaceAction } from "@/lib/actions/shipflow";
import { prisma } from "@/lib/db";

export default async function TasksPage() {
  const workspace = await ensureWorkspaceAction();
  const project = await prisma.project.findFirst({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Task board</h1>
        <p className="text-sm text-muted-foreground">
          Drag tasks between columns or use the move buttons
        </p>
      </div>

      {!project ? (
        <p className="text-sm text-muted-foreground">
          Create a project first to see tasks.
        </p>
      ) : (
        <TaskBoard projectId={project.id} />
      )}
    </div>
  );
}
