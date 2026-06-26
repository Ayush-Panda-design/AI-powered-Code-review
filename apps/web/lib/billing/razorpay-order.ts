import { prisma } from "@/lib/db";

export async function recordRazorpayCheckoutOrder(input: {
  razorpayOrderId: string;
  workspaceId: string;
  amountPaise: number;
}) {
  await prisma.razorpayCheckoutOrder.create({
    data: {
      razorpayOrderId: input.razorpayOrderId,
      workspaceId: input.workspaceId,
      amountPaise: input.amountPaise,
    },
  });
}

export async function resolveWorkspaceForRazorpayOrder(orderId: string) {
  const record = await prisma.razorpayCheckoutOrder.findUnique({
    where: { razorpayOrderId: orderId },
    select: { workspaceId: true },
  });

  return record?.workspaceId ?? null;
}

export async function markRazorpayOrderPaid(orderId: string) {
  await prisma.razorpayCheckoutOrder.updateMany({
    where: { razorpayOrderId: orderId },
    data: { status: "paid" },
  });
}
