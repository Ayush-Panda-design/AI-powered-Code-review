import { headers } from "next/headers";

import { runTasksJob } from "@/features/shipflow/server/run-shipflow-jobs";
import { formatUserFriendlyError } from "@/features/shipflow/server/user-friendly-errors";
import { getServerSession } from "@/lib/auth-session";

export async function createWebTrpcContext() {
  const session = await getServerSession();

  return {
    userId: session?.user?.id ?? null,
    jobs: {
      runTasks: async (featureRequestId: string) => {
        try {
          const result = await runTasksJob(featureRequestId);
          return { count: result.count };
        } catch (error) {
          throw new Error(formatUserFriendlyError(error));
        }
      },
    },
  };
}
