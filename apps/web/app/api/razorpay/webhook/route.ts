import { NextResponse } from "next/server";

import {
  markRazorpaySubscriptionPaid,
  resolveWorkspaceForRazorpaySubscription,
} from "@/lib/billing/razorpay-order";
import {
  renewWorkspaceProSubscription,
  upgradeWorkspaceToPro,
} from "@/lib/billing/upgrade-workspace";
import {
  isRazorpayWebhookConfigured,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay";

type RazorpayWebhookPayload = {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
        notes?: Record<string, string>;
      };
    };
    subscription?: {
      entity?: {
        id?: string;
        status?: string;
        notes?: Record<string, string>;
      };
    };
    order?: {
      entity?: {
        id?: string;
        notes?: Record<string, string>;
      };
    };
  };
};

async function resolveWorkspaceId(
  subscriptionId: string | undefined,
  notes?: Record<string, string>,
) {
  if (subscriptionId) {
    const fromRecord = await resolveWorkspaceForRazorpaySubscription(subscriptionId);
    if (fromRecord) {
      return fromRecord;
    }
  }

  return notes?.workspaceId ?? null;
}

export async function POST(request: Request) {
  if (!isRazorpayWebhookConfigured()) {
    return NextResponse.json(
      { error: "Razorpay webhook secret is not configured" },
      { status: 503 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyRazorpayWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(body) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const subscription = payload.payload?.subscription?.entity;
  const payment = payload.payload?.payment?.entity;
  const subscriptionId = subscription?.id;
  const paymentId = payment?.id;
  const notes = subscription?.notes ?? payment?.notes;

  switch (payload.event) {
    case "subscription.activated":
    case "subscription.charged": {
      const workspaceId = await resolveWorkspaceId(subscriptionId, notes);
      if (!workspaceId || !subscriptionId) {
        return NextResponse.json(
          { error: "Missing workspace context" },
          { status: 400 },
        );
      }

      const result =
        payload.event === "subscription.charged"
          ? await renewWorkspaceProSubscription(
              workspaceId,
              subscriptionId,
              paymentId,
            )
          : await upgradeWorkspaceToPro(workspaceId, {
              razorpaySubscriptionId: subscriptionId,
              razorpayPaymentId: paymentId,
            });

      if (result.upgraded) {
        await markRazorpaySubscriptionPaid(subscriptionId);
      }

      return NextResponse.json({
        ok: true,
        event: payload.event,
        upgraded: result.upgraded,
        alreadyProcessed: !result.upgraded,
      });
    }

    case "subscription.cancelled":
    case "subscription.halted": {
      const workspaceId = await resolveWorkspaceId(subscriptionId, notes);
      if (!workspaceId) {
        return NextResponse.json({ ok: true, ignored: true });
      }

      const { prisma } = await import("@/lib/db");
      await prisma.subscription.updateMany({
        where: { workspaceId },
        data: { status: "cancelled" },
      });

      return NextResponse.json({ ok: true, cancelled: true });
    }

    case "payment.captured": {
      // Legacy one-time order fallback
      const orderId = payment?.order_id ?? payload.payload?.order?.entity?.id;
      const workspaceId =
        (orderId
          ? await resolveWorkspaceForRazorpaySubscription(orderId)
          : null) ?? notes?.workspaceId;

      if (!workspaceId || !orderId || payment?.status !== "captured") {
        return NextResponse.json({ ok: true, ignored: true });
      }

      const result = await upgradeWorkspaceToPro(workspaceId, {
        razorpaySubscriptionId: orderId,
        razorpayPaymentId: paymentId,
      });

      if (result.upgraded) {
        await markRazorpaySubscriptionPaid(orderId);
      }

      return NextResponse.json({
        ok: true,
        upgraded: result.upgraded,
        legacyOrder: true,
      });
    }

    default:
      return NextResponse.json({ ok: true, ignored: true });
  }
}
