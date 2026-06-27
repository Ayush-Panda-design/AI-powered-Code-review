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
  const existing = await prisma.pRD.findUnique({
    where: { featureRequestId },
    select: { aiDraftMarkdown: true },
  });

  return prisma.pRD.upsert({
    where: { featureRequestId },
    create: {
      featureRequestId,
      ...data,
      aiDraftMarkdown: data.rawMarkdown,
      status: "draft",
    },
    update: {
      ...data,
      aiDraftMarkdown: existing?.aiDraftMarkdown ?? data.rawMarkdown,
      updatedAt: new Date(),
    },
  });
}

export async function approvePrd(featureRequestId: string) {
  const prd = await prisma.pRD.update({
    where: { featureRequestId },
    data: { status: "approved" },
  });

  await prisma.featureRequest.update({
    where: { id: featureRequestId },
    data: { status: "prd_ready" },
  });

  return prd;
}
