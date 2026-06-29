/** Map codegen / GitHub API errors to actionable messages on the Task Board. */
export function formatCodegenError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "Unknown error");
  const lower = raw.toLowerCase();

  if (
    lower.includes("sha") && lower.includes("wasn't supplied")
  ) {
    return "GitHub needs the existing file version to update this path. Try Open draft PR again, or paste the code manually.";
  }

  if (
    lower.includes("resource not accessible by integration") ||
    lower.includes("create-a-reference") ||
    lower.includes("createorupdatefilecontents") ||
    lower.includes("creating a branch") ||
    lower.includes("contents and pull requests") ||
    (lower.includes("403") && lower.includes("github"))
  ) {
    return "GitHub blocked creating a branch on this repo. Reinstall the GitHub App (Dashboard → GitHub App) with Contents and Pull requests set to Read & write, and make sure this repository is selected.";
  }

  if (lower.includes("installation required") || lower.includes("github installation")) {
    return "No GitHub App connected. Install the GitHub App from Dashboard → GitHub App, then connect this repository.";
  }

  if (lower.includes("connected repository") && lower.includes("required")) {
    return "No repository linked to this feature. Pick a code target on the feature page, or connect a repo under Repositories.";
  }

  if (lower.includes("not marked as ai-generatable")) {
    return "This task isn't set up for AI code generation.";
  }

  if (lower.includes("credit") || lower.includes("insufficient")) {
    return raw;
  }

  if (lower.includes("did not return code") || lower.includes("missing the file path")) {
    return "The AI didn't return usable code. Click Regenerate to try again.";
  }

  if (lower.includes("could not be parsed") || lower.includes("cut off")) {
    return "The AI response was incomplete. Click Regenerate to try again.";
  }

  if (raw.length > 200) {
    return "Opening the GitHub draft PR failed. Your code is still saved — use View code or try Open draft PR again.";
  }

  return raw;
}
