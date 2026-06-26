import { z } from "zod";
import {
  addClarification,
  createFeatureRequest,
  getFeatureRequest,
  listFeatureRequests,
  updateFeatureStatus,
} from "@repo/services";
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

export const featureRequestRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertProjectAccess(input.projectId, ctx.userId);
      return listFeatureRequests(input.projectId);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const feature = await getFeatureRequest(input.id);
      if (!feature) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await assertProjectAccess(feature.projectId, ctx.userId);
      return feature;
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string().min(3).max(200),
        description: z.string().min(10),
        source: z.enum(["manual", "email", "ticket", "call"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertProjectAccess(input.projectId, ctx.userId);

      const feature = await createFeatureRequest({
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        source: input.source,
        createdById: ctx.userId,
      });

      return feature;
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feature = await getFeatureRequest(input.id);
      if (!feature) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await assertProjectAccess(feature.projectId, ctx.userId);
      return updateFeatureStatus(input.id, input.status);
    }),

  addClarification: protectedProcedure
    .input(
      z.object({
        featureRequestId: z.string(),
        content: z.string().min(1),
        role: z.enum(["user", "assistant"]).default("user"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const feature = await getFeatureRequest(input.featureRequestId);
      if (!feature) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await assertProjectAccess(feature.projectId, ctx.userId);
      return addClarification(
        input.featureRequestId,
        input.role,
        input.content,
      );
    }),
});
