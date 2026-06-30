import { getGitHubApp } from "@/features/github/utils/github-app";

function parseRepoFullName(repoFullName: string) {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repository name: ${repoFullName}`);
  }

  return { owner, repo };
}

function getChecksDetailsUrl() {
  const base =
    process.env.BETTER_AUTH_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  return base ? `${base}/dashboard/pull-requests` : undefined;
}

/** Creates a completed GitHub Check Run summarizing the AI review outcome. */
export async function postPrCheckRun(
  installationId: number,
  repoFullName: string,
  headSha: string,
  input: {
    summary: string;
    blockingCount: number;
    nonBlockingCount: number;
    confidenceScore?: number;
  },
) {
  const { owner, repo } = parseRepoFullName(repoFullName);
  const app = getGitHubApp();
  const octokit = await app.getInstallationOctokit(installationId);

  const passed = input.blockingCount === 0;
  const title = passed
    ? "ShipFlow AI review passed"
    : "ShipFlow AI review — changes requested";

  let summary = input.summary;
  if (typeof input.confidenceScore === "number") {
    summary = `**Confidence:** ${input.confidenceScore}/100\n\n${summary}`;
  }

  await octokit.rest.checks.create({
    owner,
    repo,
    name: "ShipFlow AI Review",
    head_sha: headSha,
    status: "completed",
    conclusion: passed ? "success" : "failure",
    details_url: getChecksDetailsUrl(),
    output: {
      title,
      summary: summary.slice(0, 65_535),
    },
  });
}
