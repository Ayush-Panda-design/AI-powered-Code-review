/** @deprecated Use syncAllRepositories via Inngest instead. */
import {
  listInstallationRepositories,
  syncAllRepositories,
} from "./sync-github-worker";

export async function syncPullRequestsForInstallation(installationId: number) {
  const repositories = await listInstallationRepositories(installationId);
  const result = await syncAllRepositories({ installationId, repositories });
  return { synced: result.synced, queued: result.queued };
}
