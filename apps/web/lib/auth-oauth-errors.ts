const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  state_mismatch:
    "Your sign-in session expired or was interrupted. Close other tabs and try again.",
  invalid_code: "GitHub sign-in could not be completed. Please try again.",
  invalid_callback_request: "GitHub returned an invalid sign-in response. Please try again.",
  oauth_provider_not_found:
    "GitHub sign-in is not configured on this site. Contact support.",
  unable_to_get_user_info:
    "Could not read your GitHub profile. Check that your GitHub account has a public email or grant email access.",
  email_not_found:
    "GitHub did not share an email address. Make your primary email visible to authorized apps in GitHub settings, then try again.",
  account_already_linked_to_different_user:
    "This GitHub account is already linked to another ShipFlow user. Sign in with that account or use a different GitHub account.",
  unable_to_link_account: "Could not link this GitHub account. Try signing in again.",
  no_code: "GitHub sign-in was cancelled or incomplete. Please try again.",
  access_denied: "GitHub sign-in was cancelled. Please try again.",
};

export function getOAuthErrorMessage(
  code: string | null | undefined,
  description?: string | null,
) {
  if (!code) {
    return null;
  }

  return (
    OAUTH_ERROR_MESSAGES[code] ??
    (description?.trim() || "Sign-in failed. Please try again.")
  );
}
