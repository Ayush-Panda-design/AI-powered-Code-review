import { Webhooks } from "@octokit/webhooks";
import { NextResponse } from "next/server";

import {
  handleInstallationEvent,
  handleInstallationRepositoriesEvent,
  handlePullRequestEvent,
} from "@/features/github/server/webhook-events";
import type { PullRequestWebhookPayload } from "@/features/reviews/types/review";

export async function handleGitHubWebhook(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const secret = process.env.GITHUB_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const webhooks = new Webhooks({ secret });
  const isValid = await webhooks.verify(payload, signature);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let data: unknown;
  try {
    data = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (process.env.NODE_ENV === "development") {
    console.info(`[github/webhook] ${event ?? "unknown"} event received`);
  }

  try {
    switch (event) {
      case "pull_request":
        return await handlePullRequestEvent(data as PullRequestWebhookPayload);
      case "installation":
        return await handleInstallationEvent(
          data as Parameters<typeof handleInstallationEvent>[0],
        );
      case "installation_repositories":
        return await handleInstallationRepositoriesEvent(
          data as Parameters<typeof handleInstallationRepositoriesEvent>[0],
        );
      default:
        return NextResponse.json({ ok: true, ignored: true });
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[github/webhook] ${event} handler failed:`, error);
    }

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
