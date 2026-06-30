import { prisma } from "@/lib/db";

export async function recordRazorpaySubscription(input: {
  razorpaySubscriptionId: string;
  workspaceId: string;
  amountPaise: number;
}) {
  await prisma.razorpayCheckoutOrder.create({
    data: {
      razorpayOrderId: input.razorpaySubscriptionId,
      workspaceId: input.workspaceId,
      amountPaise: input.amountPaise,
    },
  });
}

/** Resolves workspace from subscription id (stored in razorpayOrderId column). */
export async function resolveWorkspaceForRazorpaySubscription(
  subscriptionId: string,
) {
  const record = await prisma.razorpayCheckoutOrder.findUnique({
    where: { razorpayOrderId: subscriptionId },
    select: { workspaceId: true },
  });

  return record?.workspaceId ?? null;
}

export async function markRazorpaySubscriptionPaid(subscriptionId: string) {
  await prisma.razorpayCheckoutOrder.updateMany({
    where: { razorpayOrderId: subscriptionId },
    data: { status: "paid" },
  });
}

/** @deprecated use subscription helpers — kept for legacy one-time orders */
export const recordRazorpayCheckoutOrder = recordRazorpaySubscription;
export const resolveWorkspaceForRazorpayOrder = resolveWorkspaceForRazorpaySubscription;
export const markRazorpayOrderPaid = markRazorpaySubscriptionPaid;
