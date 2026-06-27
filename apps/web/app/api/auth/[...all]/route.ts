import { NextRequest, NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";
import { getAuthConfigErrors } from "@/lib/auth-config";

const handler = toNextJsHandler(auth);

function authConfigResponse() {
  const errors = getAuthConfigErrors();
  return NextResponse.json(
    {
      error: "Auth is not configured correctly",
      details: errors,
    },
    { status: 503 },
  );
}

async function withAuthErrorHandling(
  request: NextRequest,
  method: "GET" | "POST",
) {
  const configErrors = getAuthConfigErrors();
  if (configErrors.length > 0) {
    return authConfigResponse();
  }

  try {
    return method === "GET"
      ? await handler.GET(request)
      : await handler.POST(request);
  } catch (error) {
    console.error(`[auth] ${request.nextUrl.pathname} failed:`, error);

    const message =
      error instanceof Error ? error.message : "Authentication request failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return withAuthErrorHandling(request, "GET");
}

export async function POST(request: NextRequest) {
  return withAuthErrorHandling(request, "POST");
}
