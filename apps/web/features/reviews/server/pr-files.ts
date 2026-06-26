import { getGitHubApp } from "@/features/github/utils/github-app";
import type { PrFilePatch } from "@/features/reviews/utils/chunk-code";

function parseRepoFullName(repoFullName: string) {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repository name: ${repoFullName}`);
  }

  return { owner, repo };
}

export async function getPullRequestFiles(
  installationId: number,
  repoFullName: string,
  prNumber: number
): Promise<PrFilePatch[]> {
  const { owner, repo } = parseRepoFullName(repoFullName);
  const app = getGitHubApp();
  const octokit = await app.getInstallationOctokit(installationId);

  const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });

  return files
    .filter((file) => Boolean(file.patch))
    .map((file) => ({
      filename: file.filename,
      patch: file.patch as string,
    }));
}
