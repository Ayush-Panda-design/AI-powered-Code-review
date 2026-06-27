import { getGitHubApp } from "@/features/github/utils/github-app";

function parseRepoFullName(repoFullName: string) {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repository name: ${repoFullName}`);
  }
  return { owner, repo };
}

export async function createDraftPullRequest(input: {
  installationId: number;
  repoFullName: string;
  baseBranch: string;
  branchName: string;
  filePath: string;
  fileContent: string;
  commitMessage: string;
  prTitle: string;
  prBody: string;
}) {
  const { owner, repo } = parseRepoFullName(input.repoFullName);
  const app = getGitHubApp();
  const octokit = await app.getInstallationOctokit(input.installationId);

  const baseRef = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${input.baseBranch}`,
  });

  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${input.branchName}`,
    sha: baseRef.data.object.sha,
  });

  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: input.filePath,
    message: input.commitMessage,
    content: Buffer.from(input.fileContent, "utf8").toString("base64"),
    branch: input.branchName,
  });

  const pullRequest = await octokit.rest.pulls.create({
    owner,
    repo,
    title: input.prTitle,
    head: input.branchName,
    base: input.baseBranch,
    body: `${input.prBody}\n\n---\n🤖 _AI-generated draft — pending ShipFlow review_`,
    draft: true,
  });

  return {
    prNumber: pullRequest.data.number,
    htmlUrl: pullRequest.data.html_url,
    headSha: pullRequest.data.head.sha,
  };
}
