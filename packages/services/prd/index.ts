import { prisma } from "@repo/database";

export type PrdPayload = {
  problemStatement: string;
  goals: string;
  nonGoals: string;
  userStories: string;
  acceptanceCriteria: string;
  edgeCases: string;
  successMetrics: string;
  rawMarkdown: string;
};

export async function upsertPrd(featureRequestId: string, data: PrdPayload) {
  return prisma.pRD.upsert({
    where: { featureRequestId },
    create: { featureRequestId, ...data, status: "draft" },
    update: { ...data, updatedAt: new Date() },
  });
}

export async function approvePrd(featureRequestId: string) {
  return prisma.pRD.update({
    where: { featureRequestId },
    data: { status: "approved" },
  });
}
