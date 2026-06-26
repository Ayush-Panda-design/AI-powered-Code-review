import { z, zodUndefinedModel } from "../../schema";
import { publicProcedure, router } from "../../trpc";
import { getServiceName } from "@repo/services";

export const healthRouter = router({
  getHealth: publicProcedure
    .meta({ openapi: { method: "GET", path: "/health" } })
    .input(zodUndefinedModel)
    .output(
      z.object({
        status: z.literal("healthy"),
        service: z.string(),
      }),
    )
    .query(async () => {
      return {
        status: "healthy" as const,
        service: getServiceName(),
      };
    }),
});
