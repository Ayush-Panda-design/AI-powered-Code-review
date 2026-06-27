import { prisma } from "@repo/database";

export type ReviewFindingInput = {
  id: string;
  severity: "blocking" | "non_blocking";
  category: string;
  title: string;
  description: string;
  filePath?: string;
  confidence?: number;
  codeSuggestion?: string;
};

function findingKey(finding: ReviewFindingInput) {
  return `${finding.severity}:${finding.title}:${finding.filePath ?? ""}`;
}

export async function loadReviewRulesForWorkspace(
  workspaceId: string,
  repoFullName?: string,
) {
  return prisma.reviewRule.findMany({
    where: {
      workspaceId,
      OR: [{ repoFullName: null }, { repoFullName: repoFullName ?? undefined }],
    },
    select: {
      pattern: true,
      category: true,
      filePath: true,
    },
  });
}

export async function loadMutedCategories(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { mutedReviewCategories: true },
  });

  if (!workspace?.mutedReviewCategories) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(workspace.mutedReviewCategories) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function createRuleFromFalsePositive(input: {
  workspaceId: string;
  repoFullName?: string;
  finding: ReviewFindingInput;
  reason?: string;
}) {
  const pattern = input.finding.title.slice(0, 120);

  const existing = await prisma.reviewRule.findFirst({
    where: {
      workspaceId: input.workspaceId,
      pattern,
      repoFullName: input.repoFullName ?? null,
    },
  });

  if (existing) {
    await prisma.reviewRule.update({
      where: { id: existing.id },
      data: { hitCount: { increment: 1 } },
    });
    return existing;
  }

  return prisma.reviewRule.create({
    data: {
      workspaceId: input.workspaceId,
      repoFullName: input.repoFullName ?? null,
      pattern,
      category: input.finding.category,
      filePath: input.finding.filePath ?? null,
      reason: input.reason ?? `Marked false positive: ${input.finding.title}`,
      source: "false_positive",
    },
  });
}

export async function recordFindingFeedback(input: {
  workspaceId: string;
  reviewId: string;
  findingId: string;
  feedback: "helpful" | "false_positive";
  reason?: string;
  repoFullName?: string;
  finding?: ReviewFindingInput;
}) {
  if (input.feedback === "false_positive" && input.finding) {
    await createRuleFromFalsePositive({
      workspaceId: input.workspaceId,
      repoFullName: input.repoFullName,
      finding: input.finding,
      reason: input.reason,
    });
  }

  return { ok: true, findingId: input.findingId, reviewId: input.reviewId };
}

export { findingKey };
