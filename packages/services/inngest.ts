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

export async function sendReviewJob(data: GitHubPrReceivedEvent) {
  return inngest.send({
    name: "github/pr.received",
    data,
  });
}
