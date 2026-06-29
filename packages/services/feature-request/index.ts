import { prisma } from "@repo/database";

export async function listFeatureRequests(projectId: string) {
  return prisma.featureRequest.findMany({
    where: { projectId },
    include: {
      prd: { select: { id: true, status: true } },
      _count: { select: { tasks: true, pullRequests: true, aiReviews: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getFeatureRequest(id: string) {
  return prisma.featureRequest.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          workspace: true,
          repositories: {
            orderBy: { createdAt: "asc" },
            select: { id: true, repoFullName: true, defaultBranch: true },
          },
        },
      },
      targetRepository: { select: { id: true, repoFullName: true, defaultBranch: true, installationId: true } },
      clarifications: { orderBy: { createdAt: "asc" } },
      prd: true,
      tasks: { orderBy: [{ status: "asc" }, { order: "asc" }] },
      pullRequests: { orderBy: { updatedAt: "desc" } },
      aiReviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          pullRequest: {
            select: {
              repoFullName: true,
              prNumber: true,
              title: true,
            },
          },
        },
      },
      approvals: { orderBy: { createdAt: "desc" }, include: { reviewer: { select: { name: true, email: true } } } },
      planApprovals: {
        orderBy: { createdAt: "asc" },
        include: { reviewer: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

function isLikelyDuplicateTitle(title: string, otherTitle: string) {
  const normalized = title.trim().toLowerCase();
  const other = otherTitle.trim().toLowerCase();
  return normalized === other || normalized.includes(other) || other.includes(normalized);
}

export async function createFeatureRequest(input: {
  projectId: string;
  title: string;
  description: string;
  source?: string;
  createdById?: string;
}) {
  const existing = await prisma.featureRequest.findMany({
    where: {
      projectId: input.projectId,
      status: { notIn: ["rejected", "duplicate", "shipped"] },
    },
    select: { title: true },
    take: 50,
  });

  const isDuplicate = existing.some((feature) =>
    isLikelyDuplicateTitle(input.title, feature.title),
  );

  return prisma.featureRequest.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      source: input.source ?? "manual",
      createdById: input.createdById,
      status: isDuplicate ? "duplicate" : "draft",
    },
  });
}

export async function updateFeatureStatus(id: string, status: string) {
  return prisma.featureRequest.update({
    where: { id },
    data: { status },
  });
}

export async function addClarification(
  featureRequestId: string,
  role: "user" | "assistant",
  content: string,
) {
  return prisma.clarificationMessage.create({
    data: { featureRequestId, role, content },
  });
}

const AUTO_CLARIFY_BLOCK_STATUSES = new Set([
  "duplicate",
  "shipped",
  "rejected",
  "clarifying",
  "prd_generating",
  "awaiting_prd_approval",
  "prd_ready",
  "planning",
  "awaiting_plan_approval",
  "in_development",
  "in_review",
  "fix_needed",
  "release_checking",
  "awaiting_approval",
]);

/** Queue the next AI clarification round after intake or a user reply. */
export async function queueAutoClarification(featureRequestId: string) {
  const feature = await prisma.featureRequest.findUnique({
    where: { id: featureRequestId },
    select: {
      status: true,
      project: { select: { workspaceId: true } },
    },
  });

  if (!feature || AUTO_CLARIFY_BLOCK_STATUSES.has(feature.status)) {
    return { queued: false as const };
  }

  const { assertHasCredits } = await import("../credits");
  const { sendClarifyJob } = await import("../inngest");
  const { AI_CREDIT_COSTS } = await import("../constants");

  try {
    await assertHasCredits(feature.project.workspaceId, AI_CREDIT_COSTS.clarify);
    await sendClarifyJob(featureRequestId);
    return { queued: true as const };
  } catch {
    return { queued: false as const };
  }
}
