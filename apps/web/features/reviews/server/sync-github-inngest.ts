import { inngest, type GitHubSyncRequestedEvent } from "@/features/inngest/client";
import {
  completeSyncRun,
  failSyncRun,
  listConnectedRepositoriesForWorkspace,
  touchSyncRun,
} from "@repo/services";
import { syncAllRepositories } from "@/features/reviews/server/sync-github-worker";

export const syncGitHubPullRequests = inngest.createFunction(
  {
    id: "sync-github-pull-requests",
    triggers: [{ event: "github/sync.requested" }],
  },
  async ({ event, step }) => {
    const { syncRunId, installationId, workspaceId } =
      event.data as GitHubSyncRequestedEvent;

    try {
      const repositories = await step.run("list-repositories", async () => {
        const connected = await listConnectedRepositoriesForWorkspace(workspaceId);
        const repoNames = [...new Set(connected.map((repo) => repo.repoFullName))];
        const repos = repoNames.map((full_name) => ({ full_name }));
        await touchSyncRun(syncRunId, { totalRepos: repos.length });
        return repos;
      });

      if (repositories.length === 0) {
        await step.run("complete-sync", async () => {
          await completeSyncRun(syncRunId, {
            syncedPRs: 0,
            changedPRs: 0,
            queuedReviews: 0,
          });
        });
        return { syncRunId, syncedPRs: 0, changedPRs: 0, queuedReviews: 0 };
      }

      // Step 2 — sync connected repos in parallel (single step, shared octokit)
      const result = await step.run("sync-all-repos", async () => {
        return syncAllRepositories({
          installationId,
          repositories,
          syncRunId,
        });
      });

      if (
        result.failedRepos === result.totalRepos &&
        result.totalRepos > 0
      ) {
        throw new Error(
          "GitHub sync failed for every repository. Check the GitHub App connection.",
        );
      }

      // Step 3 — mark complete
      await step.run("complete-sync", async () => {
        await completeSyncRun(syncRunId, {
          syncedPRs: result.synced,
          changedPRs: result.changed,
          queuedReviews: result.queued,
        });
      });

      return {
        syncRunId,
        syncedPRs: result.synced,
        changedPRs: result.changed,
        queuedReviews: result.queued,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "GitHub sync failed unexpectedly.";

      await step.run("fail-sync", async () => {
        await failSyncRun(syncRunId, message);
      });

      throw error;
    }
  },
);
