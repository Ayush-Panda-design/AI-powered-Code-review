import { PRO_PERIOD_MS, PRO_PLAN_LIMITS } from "@/lib/razorpay";
import { prisma } from "@/lib/db";

export type UpgradeWorkspaceResult =
  | { ok: true; upgraded: true }
  | { ok: true; upgraded: false; reason: "already_processed" };

type UpgradeInput = {
  razorpaySubscriptionId: string;
  razorpayPaymentId?: string;
  /** Extend from this date on renewal (defaults to now). */
  periodStart?: Date;
};

/** Idempotent Pro upgrade after Razorpay subscription payment (verify route + webhook). */
export async function upgradeWorkspaceToPro(
  workspaceId: string,
  input: UpgradeInput,
): Promise<UpgradeWorkspaceResult> {
  const { razorpaySubscriptionId, razorpayPaymentId, periodStart } = input;

  const existing = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: {
      plan: true,
      razorpaySubscriptionId: true,
      razorpayPaymentId: true,
    },
  });

  if (
    razorpayPaymentId &&
    existing?.razorpayPaymentId === razorpayPaymentId
  ) {
    return { ok: true, upgraded: false, reason: "already_processed" };
  }

  const periodEnd = new Date(
    (periodStart ?? new Date()).getTime() + PRO_PERIOD_MS,
  );

  await prisma.$transaction([
    prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        plan: "pro",
        aiCredits: PRO_PLAN_LIMITS.aiCredits,
        repoLimit: PRO_PLAN_LIMITS.repoLimit,
      },
    }),
    prisma.subscription.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        plan: "pro",
        status: "active",
        razorpaySubscriptionId,
        razorpayPaymentId: razorpayPaymentId ?? null,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan: "pro",
        status: "active",
        razorpaySubscriptionId,
        razorpayPaymentId: razorpayPaymentId ?? null,
        currentPeriodEnd: periodEnd,
      },
    }),
  ]);

  return { ok: true, upgraded: true };
}

/** Extends Pro period and refreshes credits on recurring subscription.charged events. */
export async function renewWorkspaceProSubscription(
  workspaceId: string,
  razorpaySubscriptionId: string,
  razorpayPaymentId?: string,
): Promise<UpgradeWorkspaceResult> {
  const existing = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: { currentPeriodEnd: true, razorpayPaymentId: true },
  });

  if (
    razorpayPaymentId &&
    existing?.razorpayPaymentId === razorpayPaymentId
  ) {
    return { ok: true, upgraded: false, reason: "already_processed" };
  }

  const periodStart =
    existing?.currentPeriodEnd && existing.currentPeriodEnd > new Date()
      ? existing.currentPeriodEnd
      : new Date();

  return upgradeWorkspaceToPro(workspaceId, {
    razorpaySubscriptionId,
    razorpayPaymentId,
    periodStart,
  });
}
