import { prisma } from "@repo/database";

export type TaskInput = {
  title: string;
  description?: string;
  priority?: string;
  order?: number;
};

export async function listTasks(featureRequestId: string) {
  return prisma.task.findMany({
    where: { featureRequestId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

export async function createTasks(featureRequestId: string, tasks: TaskInput[]) {
  return prisma.$transaction(
    tasks.map((task, index) =>
      prisma.task.create({
        data: {
          featureRequestId,
          title: task.title,
          description: task.description,
          priority: task.priority ?? "medium",
          order: task.order ?? index,
        },
      }),
    ),
  );
}

export async function updateTaskStatus(taskId: string, status: string) {
  return prisma.task.update({
    where: { id: taskId },
    data: { status },
  });
}

export async function listKanbanTasks(projectId: string) {
  return prisma.task.findMany({
    where: { featureRequest: { projectId } },
    include: {
      featureRequest: { select: { id: true, title: true, status: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}
