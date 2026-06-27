import { z } from "zod";
import {
  AI_CREDIT_COSTS,
  assertHasCredits,
  listKanbanTasks,
  mergeTasks,
  sendCodegenJob,
  splitTask,
  updateTaskStatus,
} from "@repo/services";
import { prisma } from "@repo/database";
import { TRPCError } from "@trpc/server";
import { throwTrpcCreditError } from "../../credit-errors";
import { protectedProcedure, router } from "../../trpc";

export const taskRouter = router({
  kanban: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await prisma.project.findFirst({
        where: {
          id: input.projectId,
          workspace: { members: { some: { userId: ctx.userId } } },
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return listKanbanTasks(input.projectId);
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        status: z.enum(["todo", "in_progress", "done"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await prisma.task.findFirst({
        where: {
          id: input.taskId,
          featureRequest: {
            project: {
              workspace: { members: { some: { userId: ctx.userId } } },
            },
          },
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updateTaskStatus(input.taskId, input.status);
    }),

  merge: protectedProcedure
    .input(
      z.object({
        primaryTaskId: z.string(),
        secondaryTaskId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await prisma.task.findFirst({
        where: {
          id: input.primaryTaskId,
          featureRequest: {
            project: {
              workspace: { members: { some: { userId: ctx.userId } } },
            },
          },
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      try {
        await mergeTasks(input.primaryTaskId, input.secondaryTaskId);
        return { ok: true };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Merge failed",
        });
      }
    }),

  split: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        parts: z
          .array(
            z.object({
              title: z.string().min(1).max(300),
              description: z.string().optional(),
            }),
          )
          .min(2)
          .max(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await prisma.task.findFirst({
        where: {
          id: input.taskId,
          featureRequest: {
            project: {
              workspace: { members: { some: { userId: ctx.userId } } },
            },
          },
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      try {
        await splitTask(input.taskId, input.parts);
        return { ok: true };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Split failed",
        });
      }
    }),

  triggerCodegen: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await prisma.task.findFirst({
        where: {
          id: input.taskId,
          featureRequest: {
            project: {
              workspace: { members: { some: { userId: ctx.userId } } },
            },
          },
        },
        include: {
          featureRequest: {
            include: { prd: true, project: { select: { workspaceId: true } } },
          },
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (!task.aiGeneratable) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This task is not marked as AI-generatable.",
        });
      }

      if (task.codeGenStatus === "generating" || task.codeGenStatus === "draft_pr_open") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Codegen already in progress or draft PR exists for this task.",
        });
      }

      if (!task.featureRequest.prd) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Generate a PRD before running AI codegen.",
        });
      }

      try {
        await assertHasCredits(
          task.featureRequest.project.workspaceId,
          AI_CREDIT_COSTS.codegen,
        );
      } catch (error) {
        throwTrpcCreditError(error);
      }

      await sendCodegenJob(task.id);

      return {
        ok: true,
        message: "Codegen queued — a draft PR will open and auto-review.",
      };
    }),
});
