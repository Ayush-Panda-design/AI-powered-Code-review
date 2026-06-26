import { inngest } from "@/features/inngest/client";
import {
  AI_CREDIT_COSTS,
  createTasks,
  getFeatureRequest,
  updateFeatureStatus,
} from "@repo/services";
import { chargeFeatureCreditsForJob } from "@/features/shipflow/server/feature-credits";
import {
  shipflowCreditJobFailure,
  shipflowFeatureNotFound,
  shipflowPrdNotFound,
} from "@/features/shipflow/server/job-results";
import { generateTasksFromPrd } from "./ai";

/** Deducts AI_CREDIT_COSTS.tasks in chargeFeatureCreditsForJob before generating tasks. */
export const generateTasks = inngest.createFunction(
  {
    id: "generate-tasks",
    triggers: [{ event: "shipflow/tasks.generate" }],
  },
  async ({ event }) => {
    const { featureRequestId } = event.data as { featureRequestId: string };
    const feature = await getFeatureRequest(featureRequestId);
    if (!feature) return shipflowFeatureNotFound();
    if (!feature.prd) return shipflowPrdNotFound();

    const creditError = await chargeFeatureCreditsForJob(
      feature.project.workspaceId,
      AI_CREDIT_COSTS.tasks,
    );
    if (creditError) return shipflowCreditJobFailure(creditError);

    await updateFeatureStatus(featureRequestId, "planning");

    const tasks = await generateTasksFromPrd(feature.prd.rawMarkdown);
    await createTasks(featureRequestId, tasks);
    await updateFeatureStatus(featureRequestId, "in_development");

    return { ok: true, count: tasks.length };
  },
);
