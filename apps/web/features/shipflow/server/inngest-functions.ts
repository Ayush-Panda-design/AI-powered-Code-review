import { inngest } from "@/features/inngest/client";
import {
  addClarification,
  AI_CREDIT_COSTS,
  consumeCredits,
  getFeatureRequest,
  resolveWorkspaceIdForFeature,
  updateFeatureStatus,
  upsertPrd,
} from "@repo/services";
import { generateClarificationQuestions, generatePrdFromRequest } from "./ai";

export const clarifyFeatureRequest = inngest.createFunction(
  {
    id: "clarify-feature-request",
    triggers: [{ event: "shipflow/feature.clarify" }],
  },
  async ({ event }) => {
    const { featureRequestId } = event.data as { featureRequestId: string };
    const feature = await getFeatureRequest(featureRequestId);
    if (!feature) return { ok: false };

    const workspaceId = await resolveWorkspaceIdForFeature(featureRequestId);
    if (!workspaceId) return { ok: false, error: "workspace_not_found" };

    try {
      await consumeCredits(workspaceId, AI_CREDIT_COSTS.clarify);
    } catch {
      return { ok: false, error: "insufficient_credits" };
    }

    await updateFeatureStatus(featureRequestId, "clarifying");

    const questions = await generateClarificationQuestions(
      feature.title,
      feature.description,
    );

    await addClarification(featureRequestId, "assistant", questions);

    return { ok: true, questions };
  },
);

export const generatePrd = inngest.createFunction(
  {
    id: "generate-prd",
    triggers: [{ event: "shipflow/prd.generate" }],
  },
  async ({ event }) => {
    const { featureRequestId } = event.data as { featureRequestId: string };
    const feature = await getFeatureRequest(featureRequestId);
    if (!feature) return { ok: false };

    const workspaceId = await resolveWorkspaceIdForFeature(featureRequestId);
    if (!workspaceId) return { ok: false, error: "workspace_not_found" };

    try {
      await consumeCredits(workspaceId, AI_CREDIT_COSTS.prd);
    } catch {
      return { ok: false, error: "insufficient_credits" };
    }

    await updateFeatureStatus(featureRequestId, "prd_generating");

    const clarifications = feature.clarifications
      .map((c) => `${c.role}: ${c.content}`)
      .join("\n");

    const prd = await generatePrdFromRequest(
      feature.title,
      feature.description,
      clarifications,
    );

    await upsertPrd(featureRequestId, prd);
    await updateFeatureStatus(featureRequestId, "prd_ready");

    return { ok: true };
  },
);
