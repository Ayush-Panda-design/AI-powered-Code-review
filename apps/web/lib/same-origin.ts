import type { NextRequest } from "next/server";

import { getAuthTrustedOrigins } from "@/lib/auth-env";

function parseOrigin(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getRequestOrigin(request: NextRequest | Request) {
  const origin = parseOrigin(request.headers.get("origin"));
  if (origin) return origin;

  return parseOrigin(request.headers.get("referer"));
}

/** True when the request comes from an allowed app origin (CSRF / cross-site guard). */
export function isSameOriginRequest(request: NextRequest | Request) {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return false;
  }

  if (secFetchSite === "same-origin" || secFetchSite === "same-site") {
    return true;
  }

  const requestOrigin = getRequestOrigin(request);
  if (!requestOrigin) {
    return request.method === "GET" || request.method === "HEAD";
  }

  return getAuthTrustedOrigins().includes(requestOrigin);
}

export function sameOriginForbiddenResponse() {
  return new Response(JSON.stringify({ error: "Forbidden: cross-origin request" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
