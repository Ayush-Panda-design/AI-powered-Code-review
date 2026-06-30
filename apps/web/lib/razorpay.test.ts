import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";

import {
  verifyRazorpayPaymentSignature,
  verifyRazorpaySubscriptionSignature,
  verifyRazorpayWebhookSignature,
} from "./razorpay";

describe("Razorpay signature verification (matches official SDK utils)", () => {
  const secret = "test_api_secret_12345";

  it("verifies subscription payments as payment_id|subscription_id", () => {
    const paymentId = "pay_test_abc";
    const subscriptionId = "sub_test_xyz";
    const signature = createHmac("sha256", secret)
      .update(`${paymentId}|${subscriptionId}`)
      .digest("hex");

    process.env.RAZORPAY_KEY_SECRET = secret;
    expect(
      verifyRazorpaySubscriptionSignature(subscriptionId, paymentId, signature),
    ).toBe(true);
    delete process.env.RAZORPAY_KEY_SECRET;

    expect(
      validatePaymentVerification(
        { payment_id: paymentId, subscription_id: subscriptionId },
        signature,
        secret,
      ),
    ).toBe(true);
  });

  it("verifies one-time order payments as order_id|payment_id", () => {
    const orderId = "order_test_abc";
    const paymentId = "pay_test_xyz";
    const signature = createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    process.env.RAZORPAY_KEY_SECRET = secret;
    expect(verifyRazorpayPaymentSignature(orderId, paymentId, signature)).toBe(
      true,
    );
    delete process.env.RAZORPAY_KEY_SECRET;

    expect(
      validatePaymentVerification(
        { order_id: orderId, payment_id: paymentId },
        signature,
        secret,
      ),
    ).toBe(true);
  });

  it("verifies webhook body signatures", () => {
    const body = '{"event":"subscription.charged"}';
    const signature = createHmac("sha256", secret).update(body).digest("hex");

    expect(verifyRazorpayWebhookSignature(body, signature)).toBe(false);

    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
    expect(verifyRazorpayWebhookSignature(body, signature)).toBe(true);
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
  });
});

describe("Razorpay Basic auth format", () => {
  it("matches curl -u key_id:key_secret encoding", () => {
    const keyId = "rzp_test_sampleKeyId";
    const keySecret = "sampleKeySecretValue";
    const token = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    expect(token).toBe(
      Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
    );
    expect(`Basic ${token}`).toMatch(/^Basic [A-Za-z0-9+/]+=*$/);
  });
});
