import type { Octokit } from "octokit";
import { NextResponse } from "next/server";

import { getInstallationOctokit } from "@/features/reviews/server/sync-github-worker";
import { requireSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";

/**
 * Reconciles task codegen status with the real state of their draft PRs on
 * GitHub. On localhost there are no webhooks, so a PR that was merged/closed
 * on GitHub still shows as "Draft PR open" until this runs.
 */
export async function POST(request: Request) {
  const session = await requireSession();

  const body = (await request.json().catch(() => null)) as {
    projectId?: string;
  } | null;

  const projectId = body?.projectId;
  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: { members: { some: { userId: session.user.id } } },
    },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const tasks = await prisma.task.findMany({
    where: {
      featureRequest: { projectId },
      draftPullRequestId: { not: null },
      draftPrNumber: { not: null },
      codeGenStatus: { in: ["draft_pr_open", "pr_open", "generating"] },
    },
    select: { id: true, draftPullRequestId: true, draftPrNumber: true },
  });

  if (tasks.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, updated: 0 });
  }

  const pullRequestIds = [
    ...new Set(tasks.map((task) => task.draftPullRequestId!)),
  ];

  const pullRequests = await prisma.pullRequest.findMany({
    where: { id: { in: pullRequestIds } },
    select: {
      id: true,
      repoFullName: true,
      prNumber: true,
      installationId: true,
    },
  });

  const prById = new Map(pullRequests.map((pr) => [pr.id, pr]));

  const octokitCache = new Map<number, Octokit>();

  async function getOctokit(installationId: number) {
    const cached = octokitCache.get(installationId);
    if (cached) return cached;
    const octokit = await getInstallationOctokit(installationId);
    octokitCache.set(installationId, octokit);
    return octokit;
  }

  let updated = 0;

  await Promise.all(
    tasks.map(async (task) => {
      const pr = prById.get(task.draftPullRequestId!);
      if (!pr) return;

      const [owner, repo] = pr.repoFullName.split("/");
      if (!owner || !repo) return;

      try {
        const octokit = await getOctokit(pr.installationId);
        const { data } = await octokit.rest.pulls.get({
          owner,
          repo,
          pull_number: pr.prNumber,
        });

        let nextStatus: string;
        if (data.merged) {
          nextStatus = "merged";
        } else if (data.state === "closed") {
          nextStatus = "closed";
        } else if (data.draft) {
          nextStatus = "draft_pr_open";
        } else {
          nextStatus = "pr_open";
        }

        await prisma.task.update({
          where: { id: task.id },
          data: { codeGenStatus: nextStatus },
        });

        await prisma.pullRequest
          .update({
            where: { id: pr.id },
            data: {
              status: data.merged
                ? "merged"
                : data.state === "closed"
                  ? "closed"
                  : undefined,
            },
          })
          .catch(() => undefined);

        updated += 1;
      } catch {
        // PR may have been deleted on GitHub; leave the task untouched.
      }
    }),
  );

  return NextResponse.json({ ok: true, checked: tasks.length, updated });
}
