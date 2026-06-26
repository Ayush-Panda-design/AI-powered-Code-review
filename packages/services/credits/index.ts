import { prisma } from "@repo/database";

import { AI_CREDIT_COSTS, getFreePlanAiCredits, isDevCreditsMode } from "../constants";

export { AI_CREDIT_COSTS };

async function topUpDevCreditsIfNeeded(workspaceId: string) {
  if (!isDevCreditsMode()) {
    return;
  }

  await prisma.workspace.updateMany({
    where: { id: workspaceId, plan: "free" },
    data: { aiCredits: getFreePlanAiCredits() },
  });
}

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
  if (!workspaceId?.trim()) {
    return null;
  }

  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { aiCredits: true, plan: true },
  });
}

export type FeatureWorkspaceResolution =
  | { ok: true; workspaceId: string }
  | { ok: false; reason: "feature_not_found" | "workspace_not_found" };

export async function resolveWorkspaceIdForFeature(
  featureRequestId: string,
): Promise<FeatureWorkspaceResolution> {
  if (!featureRequestId?.trim()) {
    return { ok: false, reason: "feature_not_found" };
  }

  const feature = await prisma.featureRequest.findUnique({
    where: { id: featureRequestId },
    select: { project: { select: { workspaceId: true } } },
  });

  if (!feature) {
    return { ok: false, reason: "feature_not_found" };
  }

  const workspaceId = feature.project.workspaceId?.trim();
  if (!workspaceId) {
    return { ok: false, reason: "workspace_not_found" };
  }

  return { ok: true, workspaceId };
}

export async function resolveWorkspaceIdForInstallation(installationId: number) {
  const install = await prisma.gitHubInstallation.findFirst({
    where: { installationId },
    select: { workspaceId: true, userId: true },
  });

  if (!install) {
    return null;
  }

  if (install.workspaceId) {
    return install.workspaceId;
  }

  // Legacy installs may only have userId; resolve via the user's first workspace membership.
  if (!install.userId) {
    return null;
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: install.userId },
    select: { workspaceId: true },
  });

  return membership?.workspaceId ?? null;
}

export async function assertHasCredits(workspaceId: string, cost: number) {
  if (!workspaceId?.trim()) {
    throw new Error("Workspace id is required to check credits");
  }

  await topUpDevCreditsIfNeeded(workspaceId);

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
  if (!workspaceId?.trim()) {
    throw new Error("Workspace id is required to consume credits");
  }

  await topUpDevCreditsIfNeeded(workspaceId);

  // Single atomic decrement — safe under concurrent Inngest jobs (no read-then-write race).
  const result = await prisma.workspace.updateMany({
    where: { id: workspaceId, aiCredits: { gte: cost } },
    data: { aiCredits: { decrement: cost } },
  });

  if (result.count === 0) {
    const workspace = await getWorkspaceCredits(workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    throw new InsufficientCreditsError(
      workspaceId,
      cost,
      workspace.aiCredits,
    );
  }
}

export type CreditConsumptionFailure =
  | { code: "feature_not_found"; message: string }
  | { code: "workspace_not_found"; message: string }
  | { code: "insufficient_credits"; message: string };

function resolutionToCreditFailure(
  resolution: Extract<FeatureWorkspaceResolution, { ok: false }>,
): CreditConsumptionFailure {
  if (resolution.reason === "feature_not_found") {
    return {
      code: "feature_not_found",
      message: "Feature request not found for credit billing.",
    };
  }

  return {
    code: "workspace_not_found",
    message: "Workspace not found for this feature request.",
  };
}

/** Resolves billing workspace from a feature id, then consumes credits atomically. */
export async function tryConsumeCreditsForFeature(
  featureRequestId: string,
  cost: number,
): Promise<CreditConsumptionFailure | null> {
  const resolution = await resolveWorkspaceIdForFeature(featureRequestId);
  if (!resolution.ok) {
    return resolutionToCreditFailure(resolution);
  }

  return tryConsumeCredits(resolution.workspaceId, cost);
}

/** Returns a failure object for expected credit errors; rethrows unexpected errors. */
export async function tryConsumeCredits(
  workspaceId: string | null | undefined,
  cost: number,
): Promise<CreditConsumptionFailure | null> {
  if (!workspaceId?.trim()) {
    return {
      code: "workspace_not_found",
      message: "Workspace not found for credit billing.",
    };
  }

  try {
    await consumeCredits(workspaceId, cost);
    return null;
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return { code: "insufficient_credits", message: error.message };
    }
    throw error;
  }
}
