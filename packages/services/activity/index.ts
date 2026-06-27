import { prisma } from "@repo/database";

export async function recordActivityEvent(input: {
  workspaceId: string;
  actorId?: string | null;
  type: string;
  title: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.activityEvent.create({
    data: {
      workspaceId: input.workspaceId,
      actorId: input.actorId ?? null,
      type: input.type,
      title: input.title,
      detail: input.detail ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}

export async function listActivityEvents(workspaceId: string, limit = 30) {
  return prisma.activityEvent.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
