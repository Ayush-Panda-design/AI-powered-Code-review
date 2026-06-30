import { z } from "zod";
import {
  assertHasCredits,
  getFeatureRequest,
  resolveWorkspaceIdForFeature,
  sendClarifyJob,
  sendPrdJob,
  sendTasksJob,
  updateFeatureStatus,
} from "@repo/services";
import { AI_CREDIT_COSTS } from "@repo/services/constants";
import { TRPCError } from "@trpc/server";
import { prisma } from "@repo/database";

import { throwTrpcCreditError } from "../../credit-errors";
import { protectedProcedure, router } from "../../trpc";

async function assertFeatureAccess(featureRequestId: string, userId: string) {
  const feature = await getFeatureRequest(featureRequestId);
  if (!feature) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Feature not found" });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId: feature.project.workspaceId,
    },
  });

  if (!member) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }

  return feature;
}

async function requireCreditsForFeature(featureRequestId: string, cost: number) {
  // Pre-check only — credits are deducted once in the Inngest worker, not here.
  const resolution = await resolveWorkspaceIdForFeature(featureRequestId);
  if (!resolution.ok) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message:
        resolution.reason === "feature_not_found"
          ? "Feature not found"
          : "Workspace not found for this feature",
    });
  }

  try {
    await assertHasCredits(resolution.workspaceId, cost);
  } catch (error) {
    throwTrpcCreditError(error);
  }
}

export const shipflowRouter = router({
  triggerClarify: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertFeatureAccess(input.featureRequestId, ctx.userId);
      await requireCreditsForFeature(
        input.featureRequestId,
        AI_CREDIT_COSTS.clarify,
      );
      await sendClarifyJob(input.featureRequestId);
      return { ok: true };
    }),

  triggerPrd: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertFeatureAccess(input.featureRequestId, ctx.userId);
      await requireCreditsForFeature(
        input.featureRequestId,
        AI_CREDIT_COSTS.prd,
      );
      await sendPrdJob(input.featureRequestId);
      return { ok: true };
    }),

  triggerTasks: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feature = await assertFeatureAccess(
        input.featureRequestId,
        ctx.userId,
      );

      if (!feature.prd || feature.prd.status !== "approved") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Approve the PRD before generating tasks.",
        });
      }

      // Allow retrying from "planning" (stuck from failed/lost Inngest job)
      // as well as the normal "prd_ready" state.
      if (feature.status !== "prd_ready" && feature.status !== "planning") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot generate tasks in status "${feature.status}". PRD must be approved first.`,
        });
      }

      await requireCreditsForFeature(
        input.featureRequestId,
        AI_CREDIT_COSTS.tasks,
      );

      if (ctx.jobs?.runTasks) {
        try {
          const result = await ctx.jobs.runTasks(input.featureRequestId);
          return { ok: true, count: result.count };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Task generation failed. Please try again.",
          });
        }
      }

      if (feature.status === "planning") {
        await updateFeatureStatus(input.featureRequestId, "prd_ready");
      }

      await updateFeatureStatus(input.featureRequestId, "planning");
      await sendTasksJob(input.featureRequestId);

      return { ok: true };
    }),

  /** Reset a feature stuck in "planning" so tasks can be regenerated. */
  resetPlanning: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feature = await assertFeatureAccess(input.featureRequestId, ctx.userId);
      if (feature.status !== "planning") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Feature is not stuck in planning." });
      }
      await updateFeatureStatus(input.featureRequestId, "prd_ready");
      return { ok: true };
    }),

  approvePrd: protectedProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feature = await assertFeatureAccess(
        input.featureRequestId,
        ctx.userId,
      );

      if (feature.status !== "awaiting_prd_approval") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Feature is not awaiting PRD approval",
        });
      }

      const { approvePrd } = await import("@repo/services");
      await approvePrd(input.featureRequestId);
      return { ok: true };
    }),
});
