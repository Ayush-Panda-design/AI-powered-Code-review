import {
  runClarifyJob,
  runPrdJob,
  runTasksJob,
} from "@/features/shipflow/server/run-shipflow-jobs";
import { formatUserFriendlyError } from "@/features/shipflow/server/user-friendly-errors";
import { getServerSession } from "@/lib/auth-session";

export async function createWebTrpcContext() {
  const session = await getServerSession();

  return {
    userId: session?.user?.id ?? null,
    jobs: {
      runClarify: async (featureRequestId: string) => {
        try {
          await runClarifyJob(featureRequestId);
        } catch (error) {
          throw new Error(formatUserFriendlyError(error));
        }
      },
      runPrd: async (featureRequestId: string) => {
        try {
          await runPrdJob(featureRequestId);
        } catch (error) {
          throw new Error(formatUserFriendlyError(error));
        }
      },
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
