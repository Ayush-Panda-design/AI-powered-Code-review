import type { GitHubLinkDiagnostics } from "@/features/github/server/installation";

export type GitHubUserErrorCode =
  | "missing_params"
  | "invalid_state"
  | "save_failed"
  | "link_failed"
  | "no_installation"
  | "needs_github_signin"
  | "wrong_github_account"
  | "app_misconfigured"
  | "invalid_installation_id";

/** Map redirect ?error= codes to user-safe copy. Never mention other users' GitHub accounts. */
export function getSafeGitHubErrorMessage(
  code: string | null | undefined,
  diagnostics: GitHubLinkDiagnostics | null,
): string | null {
  if (!code) {
    return null;
  }

  const you =
    diagnostics?.identityLogins[0] != null
      ? `@${diagnostics.identityLogins[0]}`
      : "your GitHub account";

  const messages: Record<GitHubUserErrorCode, string> = {
    missing_params:
      "GitHub did not return installation details. Click Install on GitHub again.",
    invalid_state:
      "Your session changed during the GitHub redirect. Stay signed in, then click Install on GitHub again.",
    save_failed:
      "ShipFlow could not save the connection. Try Install on GitHub again.",
    link_failed: `Install the GitHub App on ${you} first, then use Link if needed.`,
    no_installation: `The GitHub App is not installed on ${you} yet. Click Install on GitHub — do not use Link until you have completed that step on GitHub.`,
    needs_github_signin:
      "Sign in with GitHub first (not email only), then return to this page.",
    wrong_github_account: `Use one GitHub account everywhere: sign in as ${you} and install the app on that same account.`,
    app_misconfigured:
      "GitHub App server configuration is incomplete. Contact the app administrator.",
    invalid_installation_id: "Enter a valid installation ID from your GitHub installation URL.",
  };

  return messages[code as GitHubUserErrorCode] ?? "Something went wrong. Try Install on GitHub.";
}

export function mapInstallErrorToCode(error: unknown): GitHubUserErrorCode {
  const raw = error instanceof Error ? error.message : "";
  const message = raw.toLowerCase();

  if (raw.startsWith("NO_USER_INSTALL:")) {
    return "no_installation";
  }

  if (message.includes("sign in with github")) {
    return "needs_github_signin";
  }
  if (message.includes("misconfigured")) {
    return "app_misconfigured";
  }
  if (
    message.includes("different github account") ||
    message.includes("does not belong to the account you signed in with")
  ) {
    return "wrong_github_account";
  }
  if (
    message.includes("no_user_install") ||
    message.includes("no installs found") ||
    message.includes("not installed on")
  ) {
    return "no_installation";
  }

  return "link_failed";
}
