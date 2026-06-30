import { getGitHubApp } from "@/features/github/utils/github-app";
import { prisma } from "@/lib/db";

export type MergePullRequestResult = {
  prNumber: number;
  repoFullName: string;
  merged: boolean;
  alreadyMerged?: boolean;
  error?: string;
};

const OPEN_PR_STATUSES = new Set(["pending", "reviewed", "failed", "processing"]);

/** Squash-merges open PRs linked to a feature when it is marked shipped. */
export async function mergeFeaturePullRequests(
  featureRequestId: string,
  featureTitle: string,
): Promise<MergePullRequestResult[]> {
  const pullRequests = await prisma.pullRequest.findMany({
    where: {
      featureRequestId,
      status: { in: [...OPEN_PR_STATUSES] },
    },
    select: {
      id: true,
      installationId: true,
      repoFullName: true,
      prNumber: true,
    },
  });

  if (pullRequests.length === 0) {
    return [];
  }

  const app = getGitHubApp();
  const results: MergePullRequestResult[] = [];

  for (const pullRequest of pullRequests) {
    const [owner, repo] = pullRequest.repoFullName.split("/");
    if (!owner || !repo) {
      results.push({
        prNumber: pullRequest.prNumber,
        repoFullName: pullRequest.repoFullName,
        merged: false,
        error: "Invalid repository name",
      });
      continue;
    }

    try {
      const octokit = await app.getInstallationOctokit(pullRequest.installationId);
      const { data: prData } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullRequest.prNumber,
      });

      if (prData.merged) {
        await prisma.pullRequest.update({
          where: { id: pullRequest.id },
          data: { status: "merged" },
        });
        results.push({
          prNumber: pullRequest.prNumber,
          repoFullName: pullRequest.repoFullName,
          merged: true,
          alreadyMerged: true,
        });
        continue;
      }

      if (prData.state === "closed") {
        await prisma.pullRequest.update({
          where: { id: pullRequest.id },
          data: { status: "closed" },
        });
        results.push({
          prNumber: pullRequest.prNumber,
          repoFullName: pullRequest.repoFullName,
          merged: false,
          error: "Pull request is closed without merge",
        });
        continue;
      }

      await octokit.rest.pulls.merge({
        owner,
        repo,
        pull_number: pullRequest.prNumber,
        merge_method: "squash",
        commit_title: `ShipFlow: ${featureTitle}`.slice(0, 250),
      });

      await prisma.pullRequest.update({
        where: { id: pullRequest.id },
        data: { status: "merged" },
      });

      results.push({
        prNumber: pullRequest.prNumber,
        repoFullName: pullRequest.repoFullName,
        merged: true,
      });
    } catch (error) {
      results.push({
        prNumber: pullRequest.prNumber,
        repoFullName: pullRequest.repoFullName,
        merged: false,
        error: error instanceof Error ? error.message : "Merge failed",
      });
    }
  }

  return results;
}
