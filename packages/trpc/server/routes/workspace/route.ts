import { z } from "zod";
import {
  createWorkspace,
  ensureDefaultWorkspace,
  getWorkspaceForUser,
  listWorkspacesForUser,
} from "@repo/services";
import { protectedProcedure, router } from "../../trpc";

export const workspaceRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listWorkspacesForUser(ctx.userId);
  }),

  ensureDefault: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ensureDefaultWorkspace(ctx.userId, input.name);
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(80) }))
    .mutation(async ({ ctx, input }) => {
      return createWorkspace(ctx.userId, input.name);
    }),

  get: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const workspace = await getWorkspaceForUser(input.workspaceId, ctx.userId);
      if (!workspace) {
        throw new Error("Workspace not found");
      }
      return workspace;
    }),
});
