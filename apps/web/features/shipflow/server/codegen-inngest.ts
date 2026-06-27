import { inngest } from "@/features/inngest/client";
import {
  AI_CREDIT_COSTS,
  sendReviewJob,
  tryConsumeCredits,
} from "@repo/services";
import { createDraftPullRequest } from "@/features/github/server/create-draft-pr";
import { generateCodeForTask } from "@/features/shipflow/server/generate-code-for-task";
import { prisma } from "@/lib/db";

export const generateTaskCode = inngest.createFunction(
  {
    id: "generate-task-code",
    triggers: [{ event: "shipflow/task.codegen" }],
    onFailure: async ({ event, error }) => {
      const { taskId } = event.data.event.data as { taskId: string };
      await prisma.task.update({
        where: { id: taskId },
        data: { codeGenStatus: "failed" },
      }).catch(() => undefined);
      console.error("[codegen] failed:", error.message);
    },
  },
  async ({ event, step }) => {
    const { taskId } = event.data as { taskId: string };

    const task = await step.run("load-task", async () => {
      return prisma.task.findUnique({
        where: { id: taskId },
        include: {
          featureRequest: {
            include: {
              prd: true,
              project: {
                include: {
                  repositories: { take: 1 },
                },
              },
            },
          },
        },
      });
    });

    if (!task?.featureRequest?.prd) {
      throw new Error("Task requires a linked PRD");
    }

    const repo = task.featureRequest.project.repositories[0];

    const installation = await step.run("resolve-installation", async () => {
      return prisma.gitHubInstallation.findFirst({
        where: {
          OR: [
            { workspaceId: task.featureRequest.project.workspaceId },
            {
              user: {
                workspaceMembers: {
                  some: { workspaceId: task.featureRequest.project.workspaceId },
                },
              },
            },
          ],
        },
      });
    });

    if (!repo || !installation) {
      throw new Error("Connected repository and GitHub installation required");
    }

    await step.run("mark-generating", async () => {
      await prisma.task.update({
        where: { id: taskId },
        data: { codeGenStatus: "generating" },
      });
    });

    await step.run("consume-codegen-credit", async () => {
      const failure = await tryConsumeCredits(
        task.featureRequest.project.workspaceId,
        AI_CREDIT_COSTS.codegen,
      );
      if (failure) {
        throw new Error(failure.message);
      }
    });

    const codegen = await step.run("generate-code", async () => {
      return generateCodeForTask({
        taskTitle: task.title,
        taskDescription: task.description ?? "",
        prdMarkdown: task.featureRequest.prd!.rawMarkdown,
        featureTitle: task.featureRequest.title,
      });
    });

    const branchName = `shipflow/ai/${task.featureRequestId.slice(0, 8)}/${taskId.slice(0, 8)}`;

    const draftPr = await step.run("open-draft-pr", async () => {
      return createDraftPullRequest({
        installationId: installation.installationId,
        repoFullName: repo.repoFullName,
        baseBranch: repo.defaultBranch,
        branchName,
        filePath: codegen.filePath,
        fileContent: codegen.content,
        commitMessage: codegen.commitMessage,
        prTitle: `[AI] ${codegen.prTitle}`,
        prBody: codegen.prBody,
      });
    });

    const pullRequest = await step.run("save-pull-request", async () => {
      return prisma.pullRequest.upsert({
        where: {
          repoFullName_prNumber: {
            repoFullName: repo.repoFullName,
            prNumber: draftPr.prNumber,
          },
        },
        create: {
          installationId: installation.installationId,
          repoFullName: repo.repoFullName,
          prNumber: draftPr.prNumber,
          title: `[AI] ${codegen.prTitle}`,
          authorLogin: installation.accountLogin,
          headSha: draftPr.headSha,
          baseBranch: repo.defaultBranch,
          status: "pending",
          source: "ai",
          featureRequestId: task.featureRequestId,
          projectId: task.featureRequest.projectId,
          repositoryId: repo.id,
        },
        update: {
          title: `[AI] ${codegen.prTitle}`,
          headSha: draftPr.headSha,
          status: "pending",
          source: "ai",
          featureRequestId: task.featureRequestId,
        },
      });
    });

    await step.run("finalize-task", async () => {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          codeGenStatus: "draft_pr_open",
          draftPullRequestId: pullRequest.id,
        },
      });
    });

    await step.run("queue-review", async () => {
      await sendReviewJob({
        installationId: installation.installationId,
        repoFullName: repo.repoFullName,
        prNumber: draftPr.prNumber,
        title: `[AI] ${codegen.prTitle}`,
        authorLogin: installation.accountLogin,
        headSha: draftPr.headSha,
        baseBranch: repo.defaultBranch,
        action: "opened",
      });
    });

    return { ok: true, pullRequestId: pullRequest.id, prUrl: draftPr.htmlUrl };
  },
);
