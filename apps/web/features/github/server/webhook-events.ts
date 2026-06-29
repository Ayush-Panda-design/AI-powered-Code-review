import { NextResponse } from "next/server";

import {
  deleteInstallationByGitHubId,
  saveInstallationFromGitHub,
} from "@/features/github/server/installation";
import { savePullRequest } from "@/features/reviews/server/save-pull-request";
import { triggerReviewJob } from "@/features/reviews/server/trigger-review";
import {
  REVIEWABLE_PR_ACTIONS,
  type PullRequestWebhookPayload,
  type ReviewablePullRequestAction,
} from "@/features/reviews/types/review";
import { prisma } from "@/lib/db";

function isReviewableAction(
  action: string,
): action is ReviewablePullRequestAction {
  return REVIEWABLE_PR_ACTIONS.includes(action as ReviewablePullRequestAction);
}

type InstallationPayload = {
  action: string;
  installation: {
    id: number;
    account?: { id?: number; login?: string; type?: string } | null;
  };
};

type InstallationRepositoriesPayload = {
  action: string;
  installation: { id: number };
  repositories_added?: Array<{ full_name: string }>;
  repositories_removed?: Array<{ full_name: string }>;
};

async function linkInstallationToMatchingUser(installationId: number, accountId: number) {
  const githubAccount = await prisma.account.findFirst({
    where: {
      providerId: "github",
      accountId: String(accountId),
    },
    select: { userId: true },
  });

  if (!githubAccount) {
    return false;
  }

  await saveInstallationFromGitHub(githubAccount.userId, installationId);
  return true;
}

export async function handleInstallationEvent(payload: InstallationPayload) {
  const installationId = payload.installation.id;
  const accountId = payload.installation.account?.id;

  if (payload.action === "deleted") {
    await deleteInstallationByGitHubId(installationId);
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (
    (payload.action === "created" || payload.action === "added") &&
    accountId != null
  ) {
    const linked = await linkInstallationToMatchingUser(installationId, accountId);
    return NextResponse.json({ ok: true, linked });
  }

  return NextResponse.json({ ok: true, ignored: true });
}

export async function handleInstallationRepositoriesEvent(
  payload: InstallationRepositoriesPayload,
) {
  if (process.env.NODE_ENV === "development") {
    const added = payload.repositories_added?.length ?? 0;
    const removed = payload.repositories_removed?.length ?? 0;
    console.info(
      `[github/webhook] installation_repositories ${payload.action}: +${added} -${removed}`,
    );
  }

  return NextResponse.json({ ok: true });
}

export async function handlePullRequestEvent(payload: PullRequestWebhookPayload) {
  if (payload.action === "closed") {
    await prisma.pullRequest.updateMany({
      where: {
        repoFullName: payload.repository.full_name,
        prNumber: payload.pull_request.number,
      },
      data: { status: "closed" },
    });
    return NextResponse.json({ ok: true, closed: true });
  }

  if (!isReviewableAction(payload.action)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  await savePullRequest(payload);
  await triggerReviewJob(payload);

  return NextResponse.json({ ok: true });
}
