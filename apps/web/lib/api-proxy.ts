import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getMisroutedAuthCallbackRedirect } from "@/lib/auth-callback-redirect";
import { handleAuthProxy } from "@/lib/auth-proxy";
import { isSameOriginRequest, sameOriginForbiddenResponse } from "@/lib/same-origin";

const SAME_ORIGIN_API_PREFIXES = ["/api/trpc"] as const;

function requiresSameOriginCheck(pathname: string) {
  return SAME_ORIGIN_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function handleAppProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const misroutedAuthCallback = getMisroutedAuthCallbackRedirect(request);
  if (misroutedAuthCallback) {
    return NextResponse.redirect(misroutedAuthCallback);
  }

  if (requiresSameOriginCheck(pathname) && !isSameOriginRequest(request)) {
    return sameOriginForbiddenResponse();
  }

  return handleAuthProxy(request);
}
