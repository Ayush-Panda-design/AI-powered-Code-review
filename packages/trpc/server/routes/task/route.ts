import { z } from "zod";
import { listKanbanTasks, updateTaskStatus } from "@repo/services";
import { prisma } from "@repo/database";
import { TRPCError } from "@trpc/server";
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
    .input(z.object({ taskId: z.string(), status: z.enum(["todo", "in_progress", "done"]) }))
    .mutation(async ({ ctx, input }) => {
      const task = await prisma.task.findFirst({
        where: {
          id: input.taskId,
          featureRequest: {
            project: { workspace: { members: { some: { userId: ctx.userId } } } },
          },
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updateTaskStatus(input.taskId, input.status);
    }),
});
