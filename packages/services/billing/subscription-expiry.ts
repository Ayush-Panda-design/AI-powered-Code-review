import { prisma } from "@repo/database";

import { getFreePlanAiCredits } from "../constants";

const FREE_REPO_LIMIT = 2;

export async function downgradeExpiredSubscriptions() {
  const now = new Date();

  const expired = await prisma.subscription.findMany({
    where: {
      plan: "pro",
      status: "active",
      currentPeriodEnd: { lt: now },
    },
    select: { workspaceId: true },
  });

  if (expired.length === 0) {
    return { downgraded: 0 };
  }

  const freeCredits = getFreePlanAiCredits();

  for (const subscription of expired) {
    await prisma.$transaction([
      prisma.workspace.update({
        where: { id: subscription.workspaceId },
        data: {
          plan: "free",
          repoLimit: FREE_REPO_LIMIT,
          aiCredits: freeCredits,
        },
      }),
      prisma.subscription.update({
        where: { workspaceId: subscription.workspaceId },
        data: {
          plan: "free",
          status: "expired",
        },
      }),
      prisma.activityEvent.create({
        data: {
          workspaceId: subscription.workspaceId,
          type: "subscription_expired",
          title: "Pro plan expired",
          detail:
            "Workspace downgraded to the free plan. Upgrade on Billing to restore limits.",
        },
      }),
    ]);
  }

  return { downgraded: expired.length };
}
