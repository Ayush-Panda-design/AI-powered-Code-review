import { inngest } from "@/features/inngest/client";
import {
  AI_CREDIT_COSTS,
  consumeCredits,
  createTasks,
  getFeatureRequest,
  resolveWorkspaceIdForFeature,
  updateFeatureStatus,
} from "@repo/services";
import { generateTasksFromPrd } from "./ai";

export const generateTasks = inngest.createFunction(
  {
    id: "generate-tasks",
    triggers: [{ event: "shipflow/tasks.generate" }],
  },
  async ({ event }) => {
    const { featureRequestId } = event.data as { featureRequestId: string };
    const feature = await getFeatureRequest(featureRequestId);
    if (!feature?.prd) return { ok: false };

    const workspaceId = await resolveWorkspaceIdForFeature(featureRequestId);
    if (!workspaceId) return { ok: false, error: "workspace_not_found" };

    try {
      await consumeCredits(workspaceId, AI_CREDIT_COSTS.tasks);
    } catch {
      return { ok: false, error: "insufficient_credits" };
    }

    await updateFeatureStatus(featureRequestId, "planning");

    const tasks = await generateTasksFromPrd(feature.prd.rawMarkdown);
    await createTasks(featureRequestId, tasks);
    await updateFeatureStatus(featureRequestId, "in_development");

    return { ok: true, count: tasks.length };
  },
);
