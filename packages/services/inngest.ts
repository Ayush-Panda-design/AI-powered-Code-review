import { Inngest } from "inngest";

export type GitHubPrReceivedEvent = {
  installationId: number;
  repoFullName: string;
  prNumber: number;
  title: string;
  authorLogin: string;
  headSha: string;
  baseBranch: string;
  action: string;
};

export type ShipflowClarifyEvent = { featureRequestId: string };
export type ShipflowPrdEvent = { featureRequestId: string };
export type ShipflowTasksEvent = { featureRequestId: string };
export type ShipflowReleaseReadinessEvent = { featureRequestId: string };
export type ShipflowCodegenEvent = { taskId: string };
export type GitHubSyncRequestedEvent = {
  syncRunId: string;
  installationId: number;
  workspaceId: string;
};

export const inngest = new Inngest({
  id: "shipflow-ai",
});

export async function sendClarifyJob(featureRequestId: string) {
  return inngest.send({
    name: "shipflow/feature.clarify",
    data: { featureRequestId } satisfies ShipflowClarifyEvent,
  });
}

export async function sendPrdJob(featureRequestId: string) {
  return inngest.send({
    name: "shipflow/prd.generate",
    data: { featureRequestId } satisfies ShipflowPrdEvent,
  });
}

export async function sendTasksJob(featureRequestId: string) {
  return inngest.send({
    name: "shipflow/tasks.generate",
    data: { featureRequestId } satisfies ShipflowTasksEvent,
  });
}

export async function sendReleaseReadinessJob(featureRequestId: string) {
  return inngest.send({
    name: "shipflow/release.readiness",
    data: { featureRequestId } satisfies ShipflowReleaseReadinessEvent,
  });
}

export async function sendReviewJob(data: GitHubPrReceivedEvent) {
  return inngest.send({
    name: "github/pr.received",
    data,
  });
}

export async function sendCodegenJob(taskId: string) {
  return inngest.send({
    name: "shipflow/task.codegen",
    data: { taskId } satisfies ShipflowCodegenEvent,
  });
}

export async function sendGitHubSyncJob(data: GitHubSyncRequestedEvent) {
  return inngest.send({
    name: "github/sync.requested",
    data,
  });
}
