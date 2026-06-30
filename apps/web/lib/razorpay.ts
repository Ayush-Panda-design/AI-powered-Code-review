import { createHmac } from "node:crypto";
import Razorpay from "razorpay";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";

const PRO_PLAN_AMOUNT_PAISE = 99_900;
const PRO_PLAN_CURRENCY = "INR";
const PRO_SUBSCRIPTION_MONTHS = 12;

let cachedPlanId: string | null = null;
let cachedClient: Razorpay | null = null;
let cachedClientKey = "";

function readEnv(name: string) {
  const raw = process.env[name]?.trim().replace(/^\uFEFF/, "");
  if (!raw) {
    return undefined;
  }

  return raw.replace(/^["']|["']$/g, "");
}

function getRazorpayClient() {
  const key_id = readEnv("RAZORPAY_KEY_ID");
  const key_secret = readEnv("RAZORPAY_KEY_SECRET");
  if (!key_id || !key_secret) {
    throw new Error("Razorpay is not configured");
  }

  const clientKey = `${key_id}:${key_secret}`;
  if (!cachedClient || cachedClientKey !== clientKey) {
    cachedClient = new Razorpay({ key_id, key_secret });
    cachedClientKey = clientKey;
  }

  return cachedClient;
}

function wrapRazorpaySdkError(error: unknown, path: string): never {
  if (error && typeof error === "object") {
    const sdkError = error as {
      statusCode?: number;
      error?: { description?: string; reason?: string; code?: string };
      message?: string;
    };

    const detail =
      sdkError.error?.description ??
      sdkError.error?.reason ??
      sdkError.error?.code ??
      sdkError.message ??
      "Unknown Razorpay error";

    throw new RazorpayApiError(
      `Razorpay API ${path} failed: ${detail}`,
      sdkError.statusCode ?? 502,
      path,
    );
  }

  throw error;
}

export class RazorpayApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly path: string,
    readonly body?: string,
  ) {
    super(message);
    this.name = "RazorpayApiError";
  }
}

export function formatRazorpayClientError(error: unknown): {
  message: string;
  status: number;
  diagnostics?: ReturnType<typeof getRazorpayKeyDiagnostics>;
} {
  if (error instanceof RazorpayApiError) {
    const detail = error.message;
    if (error.statusCode === 401 || /unauthorized/i.test(detail)) {
      const diagnostics = getRazorpayKeyDiagnostics();

      return {
        status: 401,
        message:
          "We couldn't start checkout right now. Online upgrades are temporarily unavailable — please try again later or contact support.",
        diagnostics,
      };
    }

    if (/subscription/i.test(detail) && /not enabled|disabled/i.test(detail)) {
      return {
        status: 503,
        message:
          "Monthly billing isn't available yet. Please try again later or contact support.",
      };
    }

    return {
      status:
        error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 502,
      message:
        "Something went wrong while opening checkout. Please try again in a few minutes.",
    };
  }

  const message =
    error instanceof Error ? error.message : "Failed to create checkout";
  return {
    message: /razorpay/i.test(message)
      ? "Something went wrong while opening checkout. Please try again in a few minutes."
      : message,
    status: 500,
  };
}

/** Short message for billing UI when keys are missing (server config, not user fault). */
export function getRazorpayConfigUserMessage(): string {
  return "Online upgrades aren't available on this site yet. Please contact support if you need Pro.";
}

export function isRazorpayConfigured() {
  return Boolean(readEnv("RAZORPAY_KEY_ID") && readEnv("RAZORPAY_KEY_SECRET"));
}

export function isRazorpayWebhookConfigured() {
  return Boolean(readEnv("RAZORPAY_WEBHOOK_SECRET"));
}

/** Live checkout + webhook backup both ready (required for production). */
export function isRazorpayProductionReady() {
  return isRazorpayConfigured() && isRazorpayWebhookConfigured();
}

export function getRazorpayKeyDiagnostics() {
  const keyId = readEnv("RAZORPAY_KEY_ID");
  const keySecret = readEnv("RAZORPAY_KEY_SECRET");
  const webhookSecret = readEnv("RAZORPAY_WEBHOOK_SECRET");

  const keyIdMode = keyId?.startsWith("rzp_live_")
    ? "live"
    : keyId?.startsWith("rzp_test_")
      ? "test"
      : "invalid";

  return {
    configured: Boolean(keyId && keySecret),
    keyIdMode,
    keyIdPrefix: keyId ? `${keyId.slice(0, 12)}…` : null,
    keySecretLength: keySecret?.length ?? 0,
    webhookSecretLength: webhookSecret?.length ?? 0,
    apiSecretMatchesWebhookSecret: Boolean(
      keySecret && webhookSecret && keySecret === webhookSecret,
    ),
    keyIdLooksValid: Boolean(keyId?.match(/^rzp_(test|live)_[A-Za-z0-9]+$/)),
    keySecretLooksValid: Boolean(keySecret && keySecret.length >= 20),
  };
}

export function getRazorpayConfigError(): string | null {
  if (!readEnv("RAZORPAY_KEY_ID")) {
    return "RAZORPAY_KEY_ID is missing.";
  }
  if (!readEnv("RAZORPAY_KEY_SECRET")) {
    return "RAZORPAY_KEY_SECRET is missing.";
  }
  return null;
}

export function getRazorpayProductionConfigError(): string | null {
  const checkoutError = getRazorpayConfigError();
  if (checkoutError) {
    return checkoutError;
  }
  if (!readEnv("RAZORPAY_WEBHOOK_SECRET")) {
    return "RAZORPAY_WEBHOOK_SECRET is missing (required for production webhooks).";
  }
  return null;
}

/** Read-only ping — verifies Key ID + Key Secret without creating billing resources. */
export async function verifyRazorpayCredentials() {
  try {
    await getRazorpayClient().plans.all({ count: 1 });
    return { ok: true as const };
  } catch (error) {
    wrapRazorpaySdkError(error, "/plans");
  }
}

/** Returns dashboard plan id or creates a monthly Pro plan once per process. */
export async function getOrCreateProPlanId() {
  const fromEnv = readEnv("RAZORPAY_PLAN_ID");
  if (fromEnv) {
    return fromEnv;
  }

  if (cachedPlanId) {
    return cachedPlanId;
  }

  try {
    const plan = await getRazorpayClient().plans.create({
      period: "monthly",
      interval: 1,
      item: {
        name: "ShipFlow Pro",
        amount: PRO_PLAN_AMOUNT_PAISE,
        currency: PRO_PLAN_CURRENCY,
        description: "Monthly Pro subscription — 200 AI credits, 100 repos",
      },
    });

    cachedPlanId = plan.id;
    return plan.id;
  } catch (error) {
    wrapRazorpaySdkError(error, "/plans");
  }
}

/** Creates a Razorpay subscription for monthly Pro billing. */
export async function createProSubscription(workspaceId: string) {
  const keyId = readEnv("RAZORPAY_KEY_ID");
  if (!keyId) {
    throw new Error("RAZORPAY_KEY_ID is not set");
  }

  const planId = await getOrCreateProPlanId();

  try {
    const subscription = await getRazorpayClient().subscriptions.create({
      plan_id: planId,
      total_count: PRO_SUBSCRIPTION_MONTHS,
      quantity: 1,
      customer_notify: 1,
      notes: {
        workspaceId,
        plan: "pro",
      },
    });

    return {
      keyId,
      subscriptionId: subscription.id,
      planId: subscription.plan_id,
      amount: PRO_PLAN_AMOUNT_PAISE,
      currency: PRO_PLAN_CURRENCY,
    };
  } catch (error) {
    wrapRazorpaySdkError(error, "/subscriptions");
  }
}

export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
) {
  const secret = readEnv("RAZORPAY_KEY_SECRET");
  if (!secret) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expected === signature;
}

/** Docs + official SDK: hmac_sha256(payment_id + "|" + subscription_id, secret) */
export function verifyRazorpaySubscriptionSignature(
  subscriptionId: string,
  paymentId: string,
  signature: string,
) {
  const secret = readEnv("RAZORPAY_KEY_SECRET");
  if (!secret) {
    return false;
  }

  try {
    return validatePaymentVerification(
      { payment_id: paymentId, subscription_id: subscriptionId },
      signature,
      secret,
    );
  } catch {
    return false;
  }
}

export function verifyRazorpayWebhookSignature(body: string, signature: string) {
  const secret = readEnv("RAZORPAY_WEBHOOK_SECRET");
  if (!secret) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expected === signature;
}

export const PRO_PLAN_LIMITS = {
  aiCredits: 200,
  repoLimit: 100,
} as const;

export const PRO_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
