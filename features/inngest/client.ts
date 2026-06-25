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

export const inngest = new Inngest({
  id: "ai-code-reviewer",
});
