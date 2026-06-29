import { prisma, withDbRetry } from "@repo/database";
import { getFreePlanAiCredits, isDevCreditsMode, slugify } from "../constants";

const MAX_WORKSPACE_SLUG_ATTEMPTS = 20;

function isWorkspaceSlugConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function listWorkspacesForUser(userId: string) {
  return withDbRetry(() =>
    prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { where: { userId }, take: 1 },
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  );
}

export async function getWorkspaceForUser(workspaceId: string, userId: string) {
  return prisma.workspace.findFirst({
    where: { id: workspaceId, members: { some: { userId } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      subscription: true,
      projects: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createWorkspace(userId: string, name: string) {
  const baseSlug = slugify(name) || "workspace";

  for (let attempt = 0; attempt < MAX_WORKSPACE_SLUG_ATTEMPTS; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;

    try {
      return await prisma.workspace.create({
        data: {
          name,
          slug,
          aiCredits: getFreePlanAiCredits(),
          members: { create: { userId, role: "owner" } },
          subscription: { create: { plan: "free", status: "active" } },
        },
        include: { members: true },
      });
    } catch (error) {
      if (!isWorkspaceSlugConflict(error) || attempt === MAX_WORKSPACE_SLUG_ATTEMPTS - 1) {
        throw error;
      }
    }
  }

  throw new Error("Could not allocate a unique workspace slug");
}

export async function countConnectedRepositories(workspaceId: string) {
  return prisma.connectedRepository.count({
    where: { project: { workspaceId } },
  });
}

export async function assertWithinRepoLimit(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { repoLimit: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const connected = await countConnectedRepositories(workspaceId);
  if (connected >= workspace.repoLimit) {
    throw new Error(
      `Repository limit reached (${workspace.repoLimit}). Upgrade to Pro on Billing.`,
    );
  }
}

export async function ensureDefaultWorkspace(userId: string, userName: string) {
  const existing = await listWorkspacesForUser(userId);
  if (existing.length > 0) {
    const workspace = existing[0]!;

    if (isDevCreditsMode() && workspace.plan === "free") {
      return prisma.workspace.update({
        where: { id: workspace.id },
        data: { aiCredits: getFreePlanAiCredits() },
      });
    }

    return workspace;
  }

  try {
    return await createWorkspace(
      userId,
      `${userName.split(" ")[0] ?? "My"}'s Workspace`,
    );
  } catch (error) {
    const createdConcurrently = await listWorkspacesForUser(userId);
    if (createdConcurrently.length > 0) {
      return createdConcurrently[0]!;
    }

    throw error;
  }
}
