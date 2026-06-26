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

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
