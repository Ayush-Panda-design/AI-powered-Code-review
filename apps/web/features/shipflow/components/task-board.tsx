"use client";

import Link from "next/link";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureStatusBadge } from "@/features/shipflow/components/feature-status-badge";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";

const columns = [
  { key: "todo" as const, label: "To do" },
  { key: "in_progress" as const, label: "In progress" },
  { key: "done" as const, label: "Done" },
];

type TaskBoardProps = {
  projectId: string;
};

export function TaskBoard({ projectId }: TaskBoardProps) {
  const utils = trpc.useUtils();
  const { data: tasks = [], isLoading } = trpc.task.kanban.useQuery({ projectId });

  const updateStatus = trpc.task.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.task.kanban.invalidate({ projectId });
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading tasks…</p>;
  }

  return (
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
                <div
                  key={task.id}
                  className="rounded-lg border p-3 text-sm space-y-2"
                >
                  <p className="font-medium">{task.title}</p>
                  <Link
                    href={`/dashboard/feature-requests/${task.featureRequest.id}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    {task.featureRequest.title}
                  </Link>
                  <FeatureStatusBadge status={task.featureRequest.status} />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {columns
                      .filter((target) => target.key !== task.status)
                      .map((target) => (
                        <button
                          key={target.key}
                          type="button"
                          disabled={updateStatus.isPending}
                          onClick={() =>
                            updateStatus.mutate({
                              taskId: task.id,
                              status: target.key,
                            })
                          }
                          className={cn(
                            "rounded border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted",
                            updateStatus.isPending && "opacity-50",
                          )}
                        >
                          → {target.label}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            {tasks.filter((task) => task.status === column.key).length === 0 && (
              <p className="text-xs text-muted-foreground">No tasks</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
