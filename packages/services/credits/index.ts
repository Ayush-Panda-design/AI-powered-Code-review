import { prisma } from "@repo/database";

import { AI_CREDIT_COSTS } from "../constants";

export { AI_CREDIT_COSTS };

export class InsufficientCreditsError extends Error {
  readonly code = "INSUFFICIENT_CREDITS" as const;

  constructor(
    public readonly workspaceId: string,
    public readonly required: number,
    public readonly available: number,
  ) {
    super(
      `Insufficient AI credits (need ${required}, have ${available}). Upgrade your plan on the Billing page.`,
    );
    this.name = "InsufficientCreditsError";
  }
}

export async function getWorkspaceCredits(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { aiCredits: true, plan: true },
  });

  return workspace;
}

export async function resolveWorkspaceIdForFeature(featureRequestId: string) {
  const feature = await prisma.featureRequest.findUnique({
    where: { id: featureRequestId },
    select: { project: { select: { workspaceId: true } } },
  });

  return feature?.project.workspaceId ?? null;
}

export async function resolveWorkspaceIdForInstallation(installationId: number) {
  const install = await prisma.gitHubInstallation.findFirst({
    where: { installationId },
    select: { workspaceId: true, userId: true },
  });

  if (install?.workspaceId) {
    return install.workspaceId;
  }

  if (install?.userId) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: install.userId },
      select: { workspaceId: true },
    });
    return membership?.workspaceId ?? null;
  }

  return null;
}

export async function assertHasCredits(workspaceId: string, cost: number) {
  const workspace = await getWorkspaceCredits(workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  if (workspace.aiCredits < cost) {
    throw new InsufficientCreditsError(
      workspaceId,
      cost,
      workspace.aiCredits,
    );
  }

  return workspace;
}

export async function consumeCredits(workspaceId: string, cost: number) {
  const workspace = await getWorkspaceCredits(workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  if (workspace.aiCredits < cost) {
    throw new InsufficientCreditsError(
      workspaceId,
      cost,
      workspace.aiCredits,
    );
  }

  const result = await prisma.workspace.updateMany({
    where: { id: workspaceId, aiCredits: { gte: cost } },
    data: { aiCredits: { decrement: cost } },
  });

  if (result.count === 0) {
    const latest = await getWorkspaceCredits(workspaceId);
    throw new InsufficientCreditsError(
      workspaceId,
      cost,
      latest?.aiCredits ?? 0,
    );
  }
}
