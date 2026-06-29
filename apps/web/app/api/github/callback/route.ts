import { NextRequest, NextResponse } from "next/server";

import { DASHBOARD_BASE_PATH } from "@/features/dashboard/lib/routes";
import { saveInstallationFromGitHub } from "@/features/github/server/installation";
import { getServerSession } from "@/lib/auth-session";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const installationId = request.nextUrl.searchParams.get("installation_id");
  const state = request.nextUrl.searchParams.get("state");

  if (!installationId || !state) {
    return NextResponse.redirect(
      new URL(
        `${DASHBOARD_BASE_PATH}/github-app?error=missing_params`,
        request.url
      )
    );
  }

  if (state !== session.user.id) {
    return NextResponse.redirect(
      new URL(
        `${DASHBOARD_BASE_PATH}/github-app?error=invalid_state`,
        request.url
      )
    );
  }

  try {
    await saveInstallationFromGitHub(session.user.id, Number(installationId));
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[github/callback] save failed:", error);
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    const lower = message.toLowerCase();
    const params = new URLSearchParams();
    params.set("detail", message.slice(0, 500));

    if (
      lower.includes("different github account") ||
      lower.includes("signed in as")
    ) {
      params.set("error", "wrong_github_account");
    } else if (lower.includes("sign in with github")) {
      params.set("error", "needs_github_signin");
    } else {
      params.set("error", "save_failed");
    }

    return NextResponse.redirect(
      new URL(
        `${DASHBOARD_BASE_PATH}/github-app?${params.toString()}`,
        request.url
      )
    );
  }

  return NextResponse.redirect(
    new URL(`${DASHBOARD_BASE_PATH}/github-app`, request.url)
  );
}
