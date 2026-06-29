import type { ReviewContext } from "@/features/reviews/types/structured-review";
import { prisma } from "@/lib/db";

export async function loadReviewContext(
  featureRequestId: string | null
): Promise<ReviewContext> {
  if (!featureRequestId) {
    return {
      featureRequestId: null,
      featureTitle: null,
      prd: null,
      prdMarkdown: null,
      tasks: [],
    };
  }

  const feature = await prisma.featureRequest.findUnique({
    where: { id: featureRequestId },
    select: {
      id: true,
      title: true,
      prd: {
        select: {
          problemStatement: true,
          goals: true,
          nonGoals: true,
          userStories: true,
          acceptanceCriteria: true,
          edgeCases: true,
          rawMarkdown: true,
        },
      },
      tasks: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
          title: true,
          description: true,
          status: true,
        },
      },
    },
  });

  if (!feature) {
    return {
      featureRequestId: null,
      featureTitle: null,
      prd: null,
      prdMarkdown: null,
      tasks: [],
    };
  }

  return {
    featureRequestId: feature.id,
    featureTitle: feature.title,
    prd: feature.prd
      ? {
          problemStatement: feature.prd.problemStatement,
          goals: feature.prd.goals,
          nonGoals: feature.prd.nonGoals,
          userStories: feature.prd.userStories,
          acceptanceCriteria: feature.prd.acceptanceCriteria,
          edgeCases: feature.prd.edgeCases,
        }
      : null,
    prdMarkdown: feature.prd?.rawMarkdown ?? null,
    tasks: feature.tasks,
  };
}
