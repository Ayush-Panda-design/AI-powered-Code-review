import { inngest } from "@/features/inngest/client";
import {
  AI_CREDIT_COSTS,
  createTasks,
  getFeatureRequest,
  updateFeatureStatus,
} from "@repo/services";
import {
  chargeFeatureCreditsForJob,
} from "@/features/shipflow/server/feature-credits";
import { generateTasksFromPrd } from "./ai";

export const generateTasks = inngest.createFunction(
  {
    id: "generate-tasks",
    triggers: [{ event: "shipflow/tasks.generate" }],
  },
  async ({ event }) => {
    const { featureRequestId } = event.data as { featureRequestId: string };
    const feature = await getFeatureRequest(featureRequestId);
    if (!feature) return { ok: false, error: "feature_not_found" };
    if (!feature.prd) return { ok: false, error: "prd_not_found" };

    const creditError = await chargeFeatureCreditsForJob(
      feature.project.workspaceId,
      AI_CREDIT_COSTS.tasks,
    );
    if (creditError) return creditError;

    await updateFeatureStatus(featureRequestId, "planning");

    const tasks = await generateTasksFromPrd(feature.prd.rawMarkdown);
    await createTasks(featureRequestId, tasks);
    await updateFeatureStatus(featureRequestId, "in_development");

    return { ok: true, count: tasks.length };
  },
);
