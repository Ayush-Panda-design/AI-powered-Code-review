import type { NextRequest } from "next/server";

const GITHUB_OAUTH_CALLBACK = "/api/auth/callback/github";
const GITHUB_APP_CALLBACK = "/api/github/callback";

/**
 * GitHub OAuth and GitHub App installs sometimes redirect to the site root
 * when callback URLs are misconfigured. Forward those requests to the handlers.
 */
export function getMisroutedAuthCallbackRedirect(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname !== "/") {
    return null;
  }

  const installationId = searchParams.get("installation_id");
  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  if (installationId && state) {
    const url = new URL(GITHUB_APP_CALLBACK, request.url);
    url.search = request.nextUrl.search;
    return url;
  }

  if (state && (code || oauthError)) {
    const url = new URL(GITHUB_OAUTH_CALLBACK, request.url);
    url.search = request.nextUrl.search;
    return url;
  }

  return null;
}
