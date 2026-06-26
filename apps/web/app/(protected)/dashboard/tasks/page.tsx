import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureStatusBadge } from "@/features/shipflow/components/feature-status-badge";
import { ensureWorkspaceAction } from "@/lib/actions/shipflow";
import { listKanbanTasks } from "@repo/services";
import { prisma } from "@/lib/db";

const columns = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
] as const;

export default async function TasksPage() {
  const workspace = await ensureWorkspaceAction();
  const project = await prisma.project.findFirst({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "asc" },
  });

  const tasks = project ? await listKanbanTasks(project.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Task board</h1>
        <p className="text-sm text-muted-foreground">
          Kanban view of engineering tasks from PRDs
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((column) => (
          <Card key={column.key}>
            <CardHeader>
              <CardTitle className="text-sm">{column.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks
                .filter((task) => task.status === column.key)
                .map((task) => (
                  <div key={task.id} className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">{task.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {task.featureRequest.title}
                    </p>
                    <div className="mt-2">
                      <FeatureStatusBadge status={task.featureRequest.status} />
                    </div>
                  </div>
                ))}
              {tasks.filter((t) => t.status === column.key).length === 0 && (
                <p className="text-xs text-muted-foreground">No tasks</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
