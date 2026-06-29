import { inngest } from "@/features/inngest/client";
import {
  AI_CREDIT_COSTS,
  sendReviewJob,
  tryConsumeCredits,
} from "@repo/services";
import { createDraftPullRequest } from "@/features/github/server/create-draft-pr";
import { generateCodeForTask } from "@/features/shipflow/server/generate-code-for-task";
import { formatCodegenError } from "@/features/shipflow/lib/codegen-errors";
import { prisma } from "@/lib/db";

async function loadTaskWithRepo(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      featureRequest: {
        include: {
          prd: true,
          targetRepository: true,
          project: {
            include: {
              repositories: true,
            },
          },
        },
      },
    },
  });

  if (!task?.featureRequest?.prd) {
    throw new Error("Task requires a linked PRD");
  }

  const repo =
    task.featureRequest.targetRepository ??
    task.featureRequest.project.repositories[0];

  const installation = await prisma.gitHubInstallation.findFirst({
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

  if (!repo || !installation) {
    throw new Error("Connected repository and GitHub installation required");
  }

  return { task, repo, installation };
}

/** AI writes code only — user can open a draft PR separately or paste code manually. */
export const generateTaskCode = inngest.createFunction(
  {
    id: "generate-task-code",
    triggers: [{ event: "shipflow/task.codegen" }],
    onFailure: async ({ event, error }) => {
      const { taskId } = event.data.event.data as { taskId: string };
      const message = formatCodegenError(error);
      await prisma.task
        .update({
          where: { id: taskId },
          data: {
            codeGenStatus: "failed",
            codeGenStage: null,
            codeGenError: message.slice(0, 1000),
          },
        })
        .catch(() => undefined);
      console.error("[codegen] failed:", error.message);
    },
  },
  async ({ event, step }) => {
    const { taskId } = event.data as { taskId: string };

    const { task } = await step.run("load-task", async () => loadTaskWithRepo(taskId));

    await step.run("mark-generating", async () => {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          codeGenStatus: "generating",
          codeGenStage: "writing_code",
          codeGenError: null,
        },
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

    await step.run("finalize-code-ready", async () => {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          codeGenStatus: "code_ready",
          codeGenStage: null,
          codeGenError: null,
          generatedFilePath: codegen.filePath,
          generatedCode: codegen.content,
          generatedSummary: codegen.summary,
        },
      });
    });

    return { ok: true, status: "code_ready" };
  },
);

/** Opens a draft PR from code already saved on the task (optional step). */
export const openTaskDraftPr = inngest.createFunction(
  {
    id: "open-task-draft-pr",
    triggers: [{ event: "shipflow/task.open-draft-pr" }],
    onFailure: async ({ event, error }) => {
      const { taskId } = event.data.event.data as { taskId: string };
      const message = formatCodegenError(error);
      await prisma.task
        .update({
          where: { id: taskId },
          data: {
            codeGenStatus: "pr_failed",
            codeGenStage: null,
            codeGenError: message.slice(0, 1000),
          },
        })
        .catch(() => undefined);
      console.error("[open-draft-pr] failed:", error.message);
    },
  },
  async ({ event, step }) => {
    const { taskId } = event.data as { taskId: string };

    const { task, repo, installation } = await step.run("load-task", async () => {
      const ctx = await loadTaskWithRepo(taskId);
      if (!ctx.task.generatedCode || !ctx.task.generatedFilePath) {
        throw new Error("Generate code first before opening a draft PR.");
      }
      return ctx;
    });

    await step.run("mark-opening-pr", async () => {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          codeGenStatus: "generating",
          codeGenStage: "opening_pr",
          codeGenError: null,
        },
      });
    });

    const branchName = `shipflow/ai/${task.featureRequestId.slice(0, 8)}/${taskId.slice(0, 8)}`;
    const commitMessage = `feat: ${task.title}`;
    const prTitle = task.title;
    const prBody = task.generatedSummary ?? task.description ?? task.title;

    const draftPr = await step.run("open-draft-pr", async () => {
      return createDraftPullRequest({
        installationId: installation.installationId,
        repoFullName: repo.repoFullName,
        baseBranch: repo.defaultBranch,
        branchName,
        filePath: task.generatedFilePath!,
        fileContent: task.generatedCode!,
        commitMessage,
        prTitle,
        prBody,
      });
    });

    await step.run("stage-saving", async () => {
      await prisma.task.update({
        where: { id: taskId },
        data: { codeGenStage: "saving" },
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
          title: `[AI] ${prTitle}`,
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
          title: `[AI] ${prTitle}`,
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
          codeGenStage: null,
          codeGenError: null,
          draftPullRequestId: pullRequest.id,
          draftPrUrl: draftPr.htmlUrl,
          draftPrNumber: draftPr.prNumber,
        },
      });
    });

    await step.run("queue-review", async () => {
      await sendReviewJob({
        installationId: installation.installationId,
        repoFullName: repo.repoFullName,
        prNumber: draftPr.prNumber,
        title: `[AI] ${prTitle}`,
        authorLogin: installation.accountLogin,
        headSha: draftPr.headSha,
        baseBranch: repo.defaultBranch,
        action: "opened",
      });
    });

    return { ok: true, pullRequestId: pullRequest.id, prUrl: draftPr.htmlUrl };
  },
);
