import { z } from "zod";
import { createProject, getProject, listProjects } from "@repo/services";
import { prisma } from "@repo/database";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";

async function assertProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspace: { members: { some: { userId } } } },
  });

  if (!project) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
  }

  return project;
}

export const projectRouter = router({
  list: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const workspace = await prisma.workspace.findFirst({
        where: { id: input.workspaceId, members: { some: { userId: ctx.userId } } },
      });

      if (!workspace) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
      }

      return listProjects(input.workspaceId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        name: z.string().min(2).max(120),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const workspace = await prisma.workspace.findFirst({
        where: { id: input.workspaceId, members: { some: { userId: ctx.userId } } },
      });

      if (!workspace) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
      }

      return createProject(input.workspaceId, {
        name: input.name,
        description: input.description,
      });
    }),

  get: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertProjectAccess(input.projectId, ctx.userId);
      return getProject(input.projectId);
    }),
});
