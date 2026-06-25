import { getGitHubApp } from "@/features/github/utils/github-app";

function parseRepoFullName(repoFullName: string) {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repository name: ${repoFullName}`);
  }

  return { owner, repo };
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
