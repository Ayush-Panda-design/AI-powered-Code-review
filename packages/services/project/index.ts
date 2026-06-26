import { prisma } from "@repo/database";

export async function listProjects(workspaceId: string) {
  return prisma.project.findMany({
    where: { workspaceId },
    include: { _count: { select: { featureRequests: true, repositories: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createProject(
  workspaceId: string,
  input: { name: string; description?: string },
) {
  return prisma.project.create({
    data: {
      workspaceId,
      name: input.name,
      description: input.description,
    },
  });
}

export async function getProject(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: true,
      repositories: true,
      featureRequests: { orderBy: { updatedAt: "desc" } },
    },
  });
}
