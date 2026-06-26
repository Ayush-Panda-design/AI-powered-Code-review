import type { PullRequestWebhookPayload } from "@/features/reviews/types/review";
import { sendReviewJob, type GitHubPrReceivedEvent } from "@repo/services";

export type QueueReviewInput = {
  installationId: number;
  repoFullName: string;
  prNumber: number;
  title: string;
  authorLogin: string;
  headSha: string;
  baseBranch: string;
  action?: string;
};

export async function queueReviewForPullRequest(input: QueueReviewInput) {
  const data: GitHubPrReceivedEvent = {
    installationId: input.installationId,
    repoFullName: input.repoFullName,
    prNumber: input.prNumber,
    title: input.title,
    authorLogin: input.authorLogin,
    headSha: input.headSha,
    baseBranch: input.baseBranch,
    action: input.action ?? "opened",
  };

  return sendReviewJob(data);
}

export async function triggerReviewJob(payload: PullRequestWebhookPayload) {
  const installationId = payload.installation?.id;
  if (!installationId) {
    throw new Error("Webhook payload is missing installation.id");
  }

  const { repository, pull_request: pullRequest } = payload;

  return queueReviewForPullRequest({
    installationId,
    repoFullName: repository.full_name,
    prNumber: pullRequest.number,
    title: pullRequest.title,
    authorLogin: pullRequest.user?.login ?? "unknown",
    headSha: pullRequest.head.sha,
    baseBranch: pullRequest.base.ref,
    action: payload.action,
  });
}
