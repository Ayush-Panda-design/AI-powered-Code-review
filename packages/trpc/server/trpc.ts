import { TRPCError } from "@trpc/server";
import { initTRPC } from "@trpc/server";
import type { OpenApiMeta } from "trpc-to-openapi";

import { requireUser, type TrpcContext } from "./context";

export const tRPCContext = initTRPC
  .meta<OpenApiMeta>()
  .context<TrpcContext>()
  .create({});

export const router = tRPCContext.router;
export const publicProcedure = tRPCContext.procedure;

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  const userId = requireUser(ctx);
  return next({ ctx: { ...ctx, userId } });
});
