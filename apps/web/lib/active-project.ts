import { cookies } from "next/headers";

import { listProjects } from "@repo/services";
import { prisma } from "@/lib/db";

export const PROJECT_COOKIE = "shipflow_project";

async function getOrCreateDefaultProject(workspaceId: string) {
  const existing = await prisma.project.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  return prisma.project.create({
    data: {
      workspaceId,
      name: "Default Project",
      description: "Main product delivery pipeline",
    },
  });
}

export async function getActiveProjectForWorkspace(workspaceId: string) {
  const cookieStore = await cookies();
  const preferredId = cookieStore.get(PROJECT_COOKIE)?.value;
  const projects = await listProjects(workspaceId);

  if (projects.length === 0) {
    return getOrCreateDefaultProject(workspaceId);
  }

  if (preferredId) {
    const match = projects.find((project) => project.id === preferredId);
    if (match) {
      return match;
    }
  }

  return projects[0]!;
}
