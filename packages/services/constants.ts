export const FEATURE_STATUSES = [
  "draft",
  "clarifying",
  "prd_generating",
  "prd_ready",
  "planning",
  "in_development",
  "in_review",
  "fix_needed",
  "awaiting_approval",
  "shipped",
  "rejected",
  "duplicate",
] as const;

export type FeatureStatus = (typeof FEATURE_STATUSES)[number];

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const AI_CREDIT_COSTS = {
  clarify: 1,
  prd: 2,
  tasks: 2,
  review: 3,
} as const;

export type AiCreditAction = keyof typeof AI_CREDIT_COSTS;

export const IN_FLIGHT_FEATURE_STATUSES = [
  "clarifying",
  "prd_generating",
  "planning",
  "in_review",
] as const;

export function isInFlightFeatureStatus(status: string) {
  return (IN_FLIGHT_FEATURE_STATUSES as readonly string[]).includes(status);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
