import { AI_CREDIT_COSTS } from "@repo/services/constants";

import { BILLING_PATH } from "@/features/dashboard/lib/routes";

type CreditHintOptions = {
  cost: number;
  credits: number;
  inFlight: boolean;
  billingHref?: string;
};

export function getCreditAffordance({
  cost,
  credits,
  inFlight,
  billingHref = BILLING_PATH,
}: CreditHintOptions) {
  if (inFlight) {
    return {
      canAfford: false,
      hint: "Wait for the current AI job to finish.",
    };
  }

  if (credits < cost) {
    return {
      canAfford: false,
      hint: `Need ${cost} AI credits (you have ${credits}). Go to Billing (${billingHref}) to upgrade.`,
    };
  }

  return {
    canAfford: true,
    hint: `Uses ${cost} AI credit${cost === 1 ? "" : "s"}.`,
  };
}

export const AI_JOB_TOAST_PREFIX = "ai-job";

function sanitizeToastSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

export function aiJobToastId(featureId: string, action: string) {
  return `${AI_JOB_TOAST_PREFIX}-${sanitizeToastSegment(featureId)}-${sanitizeToastSegment(action)}`;
}

/** Minimum credits for clarify, PRD, or tasks — used by the low-credits banner only. */
const CLARIFY_PRD_TASKS_MIN_CREDIT_COST = Math.min(
  AI_CREDIT_COSTS.clarify,
  AI_CREDIT_COSTS.prd,
  AI_CREDIT_COSTS.tasks,
);

export function getLowCreditsBannerMessage(
  credits: number,
  hasLinkedPullRequests: boolean,
) {
  if (credits < CLARIFY_PRD_TASKS_MIN_CREDIT_COST) {
    return {
      show: true,
      message:
        credits === 0
          ? "You have no AI credits left. AI actions are disabled until you upgrade."
          : `You need at least ${CLARIFY_PRD_TASKS_MIN_CREDIT_COST} AI credits for clarify, PRD, or tasks (you have ${credits}).`,
    };
  }

  if (hasLinkedPullRequests && credits < AI_CREDIT_COSTS.review) {
    return {
      show: true,
      message: `You need at least ${AI_CREDIT_COSTS.review} AI credits to run a review (you have ${credits}).`,
    };
  }

  return { show: false, message: "" };
}
