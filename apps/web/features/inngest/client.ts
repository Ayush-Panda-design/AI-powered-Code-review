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
