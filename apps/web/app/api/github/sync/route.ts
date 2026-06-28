import { NextResponse } from "next/server";

import { getInstallationForUser } from "@/features/github/server/installation";
import { syncAllRepositories } from "@/features/reviews/server/sync-github-worker";
import { requireSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import {
  completeSyncRun,
  failSyncRun,
  findActiveSyncRun,
  listConnectedRepositoriesForWorkspace,
  resolveWorkspaceIdForInstallation,
  serializeSyncRun,
  touchSyncRun,
} from "@repo/services";

/**
 * Fast, direct GitHub sync for connected repos only (no Inngest queue).
 * Returns the final sync status in one response so the UI is not waiting on
 * a background worker to start.
 */
export async function POST() {
  const session = await requireSession();
  const installation = await getInstallationForUser(session.user.id);

  if (!installation) {
    return NextResponse.json(
      { error: "GitHub App is not connected." },
      { status: 400 },
    );
  }

  const workspaceId =
    installation.workspaceId ??
    (await resolveWorkspaceIdForInstallation(installation.installationId));

  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const active = await findActiveSyncRun(workspaceId);
  if (active) {
    return NextResponse.json({
      ok: true,
      syncId: active.id,
      alreadyRunning: true,
      status: serializeSyncRun(active),
    });
  }

  const connected = await listConnectedRepositoriesForWorkspace(workspaceId);
  const repoNames = [...new Set(connected.map((repo) => repo.repoFullName))];
  const repositories = repoNames.map((full_name) => ({ full_name }));

  const syncRun = await prisma.syncRun.create({
    data: {
      workspaceId,
      installationId: installation.installationId,
      status: "running",
      totalRepos: repositories.length,
    },
  });

  if (repositories.length === 0) {
    await completeSyncRun(syncRun.id, {
      syncedPRs: 0,
      changedPRs: 0,
      queuedReviews: 0,
    });

    const finished = await prisma.syncRun.findUniqueOrThrow({
      where: { id: syncRun.id },
    });

    return NextResponse.json({
      ok: true,
      syncId: syncRun.id,
      alreadyRunning: false,
      status: serializeSyncRun(finished),
    });
  }

  try {
    const result = await syncAllRepositories({
      installationId: installation.installationId,
      repositories,
      syncRunId: syncRun.id,
    });

    if (result.failedRepos === result.totalRepos && result.totalRepos > 0) {
      throw new Error(
        "GitHub sync failed for every connected repository. Check the GitHub App connection.",
      );
    }

    await touchSyncRun(syncRun.id, {
      completedRepos: repositories.length,
    });

    await completeSyncRun(syncRun.id, {
      syncedPRs: result.synced,
      changedPRs: result.changed,
      queuedReviews: result.queued,
    });

    const finished = await prisma.syncRun.findUniqueOrThrow({
      where: { id: syncRun.id },
    });

    return NextResponse.json({
      ok: true,
      syncId: syncRun.id,
      alreadyRunning: false,
      status: serializeSyncRun(finished),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "GitHub sync failed unexpectedly.";

    await failSyncRun(syncRun.id, message);

    const failed = await prisma.syncRun.findUniqueOrThrow({
      where: { id: syncRun.id },
    });

    return NextResponse.json(
      {
        ok: false,
        syncId: syncRun.id,
        error: message,
        status: serializeSyncRun(failed),
      },
      { status: 500 },
    );
  }
}
