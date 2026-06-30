import { NextResponse } from "next/server";

import {
  markRazorpaySubscriptionPaid,
} from "@/lib/billing/razorpay-order";
import { upgradeWorkspaceToPro } from "@/lib/billing/upgrade-workspace";
import { getServerSession } from "@/lib/auth-session";
import { verifyRazorpaySubscriptionSignature } from "@/lib/razorpay";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = (await request.json()) as {
      workspaceId?: string;
      razorpay_subscription_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    const {
      workspaceId,
      razorpay_subscription_id: subscriptionId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = body;

    if (!workspaceId || !subscriptionId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
      select: { role: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (membership.role !== "owner") {
      return NextResponse.json(
        { error: "Only workspace owners can upgrade billing" },
        { status: 403 },
      );
    }

    if (
      !verifyRazorpaySubscriptionSignature(subscriptionId, paymentId, signature)
    ) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 401 });
    }

    const result = await upgradeWorkspaceToPro(workspaceId, {
      razorpaySubscriptionId: subscriptionId,
      razorpayPaymentId: paymentId,
    });

    if (result.upgraded) {
      await markRazorpaySubscriptionPaid(subscriptionId);
    }

    return NextResponse.json({
      ok: true,
      upgraded: result.upgraded,
      alreadyProcessed: !result.upgraded,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
