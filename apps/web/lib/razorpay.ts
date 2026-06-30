import { createHmac } from "node:crypto";

const PRO_PLAN_AMOUNT_PAISE = 99_900;
const PRO_PLAN_CURRENCY = "INR";
const PRO_SUBSCRIPTION_MONTHS = 12;

let cachedPlanId: string | null = null;

function readEnv(name: string) {
  return process.env[name]?.trim() || undefined;
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

function getAuthHeader() {
  const keyId = readEnv("RAZORPAY_KEY_ID");
  const keySecret = readEnv("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured");
  }

  const token = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  return `Basic ${token}`;
}

async function razorpayFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Razorpay API ${path} failed: ${errorBody}`);
  }

  return response.json() as Promise<T>;
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

  const plan = await razorpayFetch<{ id: string }>("/plans", {
    method: "POST",
    body: JSON.stringify({
      period: "monthly",
      interval: 1,
      item: {
        name: "ShipFlow Pro",
        amount: PRO_PLAN_AMOUNT_PAISE,
        currency: PRO_PLAN_CURRENCY,
        description: "Monthly Pro subscription — 200 AI credits, 100 repos",
      },
    }),
  });

  cachedPlanId = plan.id;
  return plan.id;
}

/** Creates a Razorpay subscription for monthly Pro billing. */
export async function createProSubscription(workspaceId: string) {
  const keyId = readEnv("RAZORPAY_KEY_ID");
  if (!keyId) {
    throw new Error("RAZORPAY_KEY_ID is not set");
  }

  const planId = await getOrCreateProPlanId();
  const subscription = await razorpayFetch<{
    id: string;
    status: string;
    plan_id: string;
  }>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: planId,
      total_count: PRO_SUBSCRIPTION_MONTHS,
      quantity: 1,
      customer_notify: 1,
      notes: {
        workspaceId,
        plan: "pro",
      },
    }),
  });

  return {
    keyId,
    subscriptionId: subscription.id,
    planId: subscription.plan_id,
    amount: PRO_PLAN_AMOUNT_PAISE,
    currency: PRO_PLAN_CURRENCY,
  };
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

export function verifyRazorpaySubscriptionSignature(
  subscriptionId: string,
  paymentId: string,
  signature: string,
) {
  const secret = readEnv("RAZORPAY_KEY_SECRET");
  if (!secret) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");

  return expected === signature;
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
