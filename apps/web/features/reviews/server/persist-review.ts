import { recordActivityEvent } from "@repo/services";
import { withDbRetry } from "@repo/database";
import type { StructuredReview } from "@/features/reviews/types/structured-review";
import { sendReleaseReadinessJob } from "@repo/services";
import { prisma } from "@/lib/db";

import type { PrSizeMetrics } from "@/features/reviews/server/review-noise";

type PersistReviewInput = {
  pullRequestId: string;
  featureRequestId: string | null;
  review: StructuredReview;
  blockingCount: number;
  nonBlockingCount: number;
  confidenceScore?: number;
  reviewComment: string;
  workspaceId?: string | null;
};

export async function trySavePrMetrics(
  pullRequestId: string,
  metrics: PrSizeMetrics,
) {
  try {
    await prisma.pullRequest.update({
      where: { id: pullRequestId },
      data: {
        filesChanged: metrics.filesChanged,
        additions: metrics.additions,
        deletions: metrics.deletions,
        linesChanged: metrics.linesChanged,
        sizeWarning: metrics.sizeWarning,
      },
    });
  } catch {
    // PR size columns are optional until migration + client regen.
  }
}

export async function persistReviewResult(input: PersistReviewInput) {
  const reviewedAt = new Date();

  await withDbRetry(async () => {
    await prisma.pullRequest.update({
      where: { id: input.pullRequestId },
      data: {
        status: "reviewed",
        reviewComment: input.reviewComment,
        reviewedAt,
      },
    });
  });

  await withDbRetry(async () => {
    try {
      await prisma.aIReview.create({
        data: {
          pullRequestId: input.pullRequestId,
          featureRequestId: input.featureRequestId,
          summary: input.review.summary,
          findings: JSON.stringify(input.review.findings),
          blockingCount: input.blockingCount,
          nonBlockingCount: input.nonBlockingCount,
          confidenceScore: input.confidenceScore ?? null,
          prdAlignment: input.review.prdAlignment,
          status: "completed",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("confidenceScore")) {
        throw error;
      }

      await prisma.aIReview.create({
        data: {
          pullRequestId: input.pullRequestId,
          featureRequestId: input.featureRequestId,
          summary: input.review.summary,
          findings: JSON.stringify(input.review.findings),
          blockingCount: input.blockingCount,
          nonBlockingCount: input.nonBlockingCount,
          prdAlignment: input.review.prdAlignment,
          status: "completed",
        },
      });
    }
  });

  if (input.featureRequestId) {
    const nextStatus =
      input.blockingCount > 0 ? "fix_needed" : "release_checking";

    await withDbRetry(async () => {
      await prisma.featureRequest.update({
        where: { id: input.featureRequestId! },
        data: { status: nextStatus },
      });
    });
  }

  if (input.workspaceId) {
    try {
      await recordActivityEvent({
        workspaceId: input.workspaceId,
        type: input.blockingCount > 0 ? "review_blocking" : "review_complete",
        title:
          input.blockingCount > 0
            ? `Review found ${input.blockingCount} blocking issue(s)`
            : "AI review passed with 0 blocking issues",
        detail: input.review.summary.slice(0, 500),
        metadata: {
          pullRequestId: input.pullRequestId,
          blockingCount: input.blockingCount,
          confidenceScore: input.confidenceScore,
        },
      });
    } catch {
      // Optional activity feed.
    }
  }

  if (input.featureRequestId && input.blockingCount === 0) {
    await sendReleaseReadinessJob(input.featureRequestId);
  }
}

export async function markFeatureInReview(featureRequestId: string | null) {
  if (!featureRequestId) {
    return;
  }

  const feature = await prisma.featureRequest.findUnique({
    where: { id: featureRequestId },
    select: { status: true },
  });

  if (!feature) {
    return;
  }

  const skipStatuses = new Set(["shipped", "rejected", "duplicate"]);

  if (skipStatuses.has(feature.status)) {
    return;
  }

  await prisma.featureRequest.update({
    where: { id: featureRequestId },
    data: { status: "in_review" },
  });
}
