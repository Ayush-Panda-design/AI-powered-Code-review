"use server";

import { revalidatePath } from "next/cache";

import { queueReviewForPullRequest } from "@/features/reviews/server/trigger-review";
import { requestManualReReview } from "@/features/shipflow/server/feature-workflow";
import { requireSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import {
  AI_CREDIT_COSTS,
  assertHasCredits,
  ensureDefaultWorkspace,
  InsufficientCreditsError,
  resolveWorkspaceIdForFeature,
  sendClarifyJob,
  sendPrdJob,
  sendTasksJob,
} from "@repo/services";

export async function ensureWorkspaceAction() {
  const session = await requireSession();
  const workspace = await ensureDefaultWorkspace(
    session.user.id,
    session.user.name ?? "User",
  );
  return workspace;
}

async function assertFeatureCredits(
  featureRequestId: string,
  cost: number,
) {
  const resolution = await resolveWorkspaceIdForFeature(featureRequestId);
  if (!resolution.ok) {
    throw new Error(
      resolution.reason === "feature_not_found"
        ? "Feature not found"
        : "Workspace not found for this feature",
    );
  }

  await assertHasCredits(resolution.workspaceId, cost);
  return resolution.workspaceId;
}

export async function triggerClarificationAction(featureRequestId: string) {
  await requireSession();
  await assertFeatureCredits(featureRequestId, AI_CREDIT_COSTS.clarify);
  await sendClarifyJob(featureRequestId);
  revalidatePath(`/dashboard/feature-requests/${featureRequestId}`);
}

export async function triggerPrdGenerationAction(featureRequestId: string) {
  await requireSession();
  await assertFeatureCredits(featureRequestId, AI_CREDIT_COSTS.prd);
  await sendPrdJob(featureRequestId);
  revalidatePath(`/dashboard/feature-requests/${featureRequestId}`);
}

export async function triggerTaskGenerationAction(featureRequestId: string) {
  await requireSession();
  await assertFeatureCredits(featureRequestId, AI_CREDIT_COSTS.tasks);
  await sendTasksJob(featureRequestId);
  revalidatePath(`/dashboard/feature-requests/${featureRequestId}`);
  revalidatePath("/dashboard/tasks");
}

export { InsufficientCreditsError };

export async function approveReleaseAction(
  featureRequestId: string,
  notes?: string
) {
  const session = await requireSession();

  const feature = await prisma.featureRequest.findUnique({
    where: { id: featureRequestId },
    select: { status: true },
  });

  if (!feature || feature.status !== "awaiting_approval") {
    throw new Error("Feature is not awaiting approval");
  }

  await prisma.$transaction([
    prisma.releaseApproval.create({
      data: {
        featureRequestId,
        reviewerId: session.user.id,
        decision: "approved",
        notes: notes?.trim() || null,
      },
    }),
    prisma.featureRequest.update({
      where: { id: featureRequestId },
      data: { status: "shipped" },
    }),
  ]);

  revalidatePath(`/dashboard/feature-requests/${featureRequestId}`);
}

export async function rejectReleaseAction(
  featureRequestId: string,
  notes?: string
) {
  const session = await requireSession();

  const feature = await prisma.featureRequest.findUnique({
    where: { id: featureRequestId },
    select: { status: true },
  });

  if (!feature || feature.status !== "awaiting_approval") {
    throw new Error("Feature is not awaiting approval");
  }

  await prisma.$transaction([
    prisma.releaseApproval.create({
      data: {
        featureRequestId,
        reviewerId: session.user.id,
        decision: "rejected",
        notes: notes?.trim() || null,
      },
    }),
    prisma.featureRequest.update({
      where: { id: featureRequestId },
      data: { status: "fix_needed" },
    }),
  ]);

  revalidatePath(`/dashboard/feature-requests/${featureRequestId}`);
}

export async function requestReReviewAction(featureRequestId: string) {
  await requireSession();
  await assertFeatureCredits(featureRequestId, AI_CREDIT_COSTS.review);

  const pullRequest = await requestManualReReview(featureRequestId);

  await queueReviewForPullRequest({
    installationId: pullRequest.installationId,
    repoFullName: pullRequest.repoFullName,
    prNumber: pullRequest.prNumber,
    title: pullRequest.title,
    authorLogin: pullRequest.authorLogin,
    headSha: pullRequest.headSha,
    baseBranch: pullRequest.baseBranch,
    action: "synchronize",
  });

  revalidatePath(`/dashboard/feature-requests/${featureRequestId}`);
  revalidatePath("/dashboard/pull-requests");
}
