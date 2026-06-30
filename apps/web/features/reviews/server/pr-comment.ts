import { getGitHubApp } from "@/features/github/utils/github-app";

export type InlineReviewFinding = {
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  title: string;
  description: string;
  severity: "blocking" | "non_blocking";
  codeSuggestion?: string;
};

function parseRepoFullName(repoFullName: string) {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repository name: ${repoFullName}`);
  }

  return { owner, repo };
}

function formatInlineCommentBody(finding: InlineReviewFinding) {
  const label =
    finding.severity === "blocking" ? "Blocking" : "Non-blocking";
  const lines = [
    `**${label}: ${finding.title}**`,
    "",
    finding.description,
  ];

  if (finding.codeSuggestion) {
    lines.push("", "**Suggested fix:**", "```", finding.codeSuggestion, "```");
  }

  return lines.join("\n");
}

export async function postPrComment(
  installationId: number,
  repoFullName: string,
  prNumber: number,
  body: string
) {
  const { owner, repo } = parseRepoFullName(repoFullName);
  const app = getGitHubApp();
  const octokit = await app.getInstallationOctokit(installationId);

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
}

/** Posts a PR review with inline line comments when findings include file paths and line numbers. */
export async function postPrReviewWithComments(
  installationId: number,
  repoFullName: string,
  prNumber: number,
  headSha: string,
  body: string,
  findings: InlineReviewFinding[],
  blockingCount: number,
) {
  const { owner, repo } = parseRepoFullName(repoFullName);
  const app = getGitHubApp();
  const octokit = await app.getInstallationOctokit(installationId);

  const inlineComments = findings
    .filter((finding) => finding.filePath && finding.lineStart)
    .slice(0, 20)
    .map((finding) => ({
      path: finding.filePath!,
      line: finding.lineStart!,
      side: "RIGHT" as const,
      body: formatInlineCommentBody(finding),
    }));

  if (inlineComments.length > 0) {
    await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      commit_id: headSha,
      event: blockingCount > 0 ? "REQUEST_CHANGES" : "COMMENT",
      body,
      comments: inlineComments,
    });
    return { mode: "review" as const, inlineCount: inlineComments.length };
  }

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });

  return { mode: "comment" as const, inlineCount: 0 };
}
