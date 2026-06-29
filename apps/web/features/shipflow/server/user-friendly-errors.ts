/**
 * Turn technical errors (Prisma, AI, network) into plain-language messages
 * for the UI. Never expose stack traces or internal class names.
 */
export function formatUserFriendlyError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "Unknown error");
  const lower = raw.toLowerCase();

  if (
    (lower.includes("transaction") && (lower.includes("timeout") || lower.includes("expired"))) ||
    lower.includes("rollback cannot be executed")
  ) {
    return "Saving your tasks took too long — this is usually a slow database connection. Please click Retry again.";
  }

  if (
    lower.includes("connection terminated") ||
    lower.includes("econnreset") ||
    lower.includes("connection") && lower.includes("timeout") ||
    lower.includes("can't reach database") ||
    lower.includes("p1001") ||
    lower.includes("p1008")
  ) {
    return "We couldn't reach the database. Wait a few seconds and try again.";
  }

  if (lower.includes("json") && (lower.includes("parse") || lower.includes("unexpected token"))) {
    return "The AI returned an unexpected format. Please try generating tasks again.";
  }

  if (lower.includes("task model did not return") || lower.includes("did not return a json")) {
    return "The AI couldn't build a task list from your PRD. Try again, or edit the PRD to be shorter.";
  }

  if (lower.includes("approve the prd")) {
    return "Approve the PRD first, then generate tasks.";
  }

  if (lower.includes("credit") || lower.includes("insufficient")) {
    return raw;
  }

  // Prisma / Turbopack / internal — never show to users
  if (
    raw.includes("Invalid `") ||
    raw.includes("TURBOPACK") ||
    raw.includes("prisma.") ||
    raw.includes("__TURBOPACK__") ||
    raw.includes("invocation in")
  ) {
    return "Something went wrong while saving your tasks. Please try again.";
  }

  if (raw.length > 180) {
    return "Task generation failed. Please try again.";
  }

  return raw;
}

export { formatCodegenError } from "@/features/shipflow/lib/codegen-errors";
