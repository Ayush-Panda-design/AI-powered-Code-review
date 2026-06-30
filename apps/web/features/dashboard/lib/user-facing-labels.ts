/** Human-readable labels for values that are stored as machine identifiers in the database. */

export const FEATURE_SOURCE_LABELS: Record<string, string> = {
  manual: "Manual form",
  email: "Email",
  ticket: "Support ticket",
  call: "Customer call",
};

export function formatFeatureSource(source: string) {
  return FEATURE_SOURCE_LABELS[source] ?? source.replace(/_/g, " ");
}

export const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
};

export function formatPlan(plan: string) {
  return PLAN_LABELS[plan] ?? plan.charAt(0).toUpperCase() + plan.slice(1);
}

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  review_complete: "Review completed",
  review_blocking: "Blocking issues found",
  feature_shipped: "Feature shipped",
  release_rejected: "Release rejected",
  subscription_expired: "Plan expired",
  stale_pr_nudge: "Stale pull request",
  github_repos_added: "Repositories added",
  plan_approved: "Plan approved",
  prd_approved: "Requirements approved",
};

export function formatActivityType(type: string) {
  return (
    ACTIVITY_TYPE_LABELS[type] ??
    type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

export function formatGitHubAccountType(accountType: string) {
  if (accountType === "User") return "Personal account";
  if (accountType === "Organization") return "Organization";
  return accountType;
}

export function formatCreditCost(cost: number) {
  return `${cost} credit${cost === 1 ? "" : "s"}`;
}

export function formatAiActionLabel(action: string, creditCost: number) {
  return `${action} · ${formatCreditCost(creditCost)}`;
}

/** Map internal config error strings to text safe to show end users. */
export function formatReviewConfigError(error: string) {
  if (error.includes("OPENROUTER_API_KEY")) {
    return "AI service is not connected yet.";
  }
  return "A required AI setting is missing.";
}

export function formatReviewConfigWarning(warning: string) {
  if (warning.includes("PINECONE")) {
    return "Advanced search context is off — reviews still work with built-in matching.";
  }
  return warning.replace(/PINECONE_\w+/g, "search service");
}

export function isDevelopmentEnvironment() {
  return process.env.NODE_ENV === "development";
}
