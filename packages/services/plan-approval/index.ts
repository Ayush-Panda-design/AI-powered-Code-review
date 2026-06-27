import { prisma } from "@repo/database";

import { PLAN_APPROVALS_REQUIRED } from "../constants";

export async function listPlanApprovals(featureRequestId: string) {
  return prisma.planApproval.findMany({
    where: { featureRequestId },
    include: {
      reviewer: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRequiredPlanApprovals(workspaceId: string) {
  const memberCount = await prisma.workspaceMember.count({
    where: { workspaceId },
  });

  return Math.min(PLAN_APPROVALS_REQUIRED, Math.max(1, memberCount));
}

export async function recordPlanApproval(
  featureRequestId: string,
  reviewerId: string,
  workspaceId: string,
) {
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: reviewerId },
  });

  if (!member) {
    throw new Error("Only workspace members can approve the engineering plan");
  }

  await prisma.planApproval.upsert({
    where: {
      featureRequestId_reviewerId: {
        featureRequestId,
        reviewerId,
      },
    },
    create: { featureRequestId, reviewerId },
    update: {},
  });

  const [approvalCount, required] = await Promise.all([
    prisma.planApproval.count({ where: { featureRequestId } }),
    getRequiredPlanApprovals(workspaceId),
  ]);

  if (approvalCount >= required) {
    await prisma.featureRequest.update({
      where: { id: featureRequestId },
      data: { status: "in_development" },
    });
    return { complete: true, approvalCount, required };
  }

  return { complete: false, approvalCount, required };
}
