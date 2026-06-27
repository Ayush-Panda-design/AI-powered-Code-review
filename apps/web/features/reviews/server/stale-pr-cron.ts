import { inngest } from "@/features/inngest/client";
import { STALE_PR_HOURS } from "@repo/services/constants";
import { prisma } from "@/lib/db";

export const checkStalePullRequests = inngest.createFunction(
  {
    id: "check-stale-pull-requests",
    triggers: [{ cron: "0 */6 * * *" }],
  },
  async ({ step }) => {
    const staleBefore = new Date(Date.now() - STALE_PR_HOURS * 60 * 60 * 1000);

    const stalePullRequests = await step.run("find-stale-prs", async () => {
      return prisma.pullRequest.findMany({
        where: {
          status: { in: ["pending", "reviewed"] },
          updatedAt: { lt: staleBefore },
        },
        take: 50,
        select: {
          id: true,
          installationId: true,
          repoFullName: true,
          prNumber: true,
          title: true,
          updatedAt: true,
          featureRequest: {
            select: { project: { select: { workspaceId: true } } },
          },
        },
      });
    });

    let nudged = 0;

    for (const pullRequest of stalePullRequests) {
      const workspaceId =
        pullRequest.featureRequest?.project.workspaceId ??
        (
          await prisma.gitHubInstallation.findFirst({
            where: { installationId: pullRequest.installationId },
            select: { workspaceId: true },
          })
        )?.workspaceId;

      if (!workspaceId) {
        continue;
      }

      await step.run(`nudge-${pullRequest.id}`, async () => {
        await prisma.activityEvent.create({
          data: {
            workspaceId,
            type: "stale_pr_nudge",
            title: `Stale PR #${pullRequest.prNumber} needs attention`,
            detail: `${pullRequest.title} — no activity since ${new Date(pullRequest.updatedAt).toISOString()}`,
            metadata: JSON.stringify({
              pullRequestId: pullRequest.id,
              repoFullName: pullRequest.repoFullName,
              prNumber: pullRequest.prNumber,
            }),
          },
        });
      });

      nudged += 1;
    }

    return { nudged };
  },
);
