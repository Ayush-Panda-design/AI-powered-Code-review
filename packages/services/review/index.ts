import { prisma } from "@repo/database";

export async function listPullRequestsForInstallation(installationId: number) {
  return prisma.pullRequest.findMany({
    where: { installationId },
    include: {
      featureRequest: { select: { id: true, title: true, status: true } },
      aiReviews: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          blockingCount: true,
          nonBlockingCount: true,
          prdAlignment: true,
          summary: true,
          confidenceScore: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function parseReviewFindings(raw: string) {
  try {
    const parsed = JSON.parse(raw) as Array<{
      id: string;
      severity: string;
      category: string;
      title: string;
      description: string;
      filePath?: string;
      confidence?: number;
      codeSuggestion?: string;
    }>;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
