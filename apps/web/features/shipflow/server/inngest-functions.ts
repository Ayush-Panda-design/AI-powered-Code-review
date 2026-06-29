import { inngest } from "@/features/inngest/client";
import {
  AI_CREDIT_COSTS,
  addClarification,
  getFeatureRequest,
  updateFeatureStatus,
  upsertPrd,
} from "@repo/services";
import { chargeFeatureCreditsForJob } from "@/features/shipflow/server/feature-credits";
import {
  shipflowCreditJobFailure,
  shipflowFeatureNotFound,
} from "@/features/shipflow/server/job-results";
import { generateClarificationQuestions, generatePrdFromRequest } from "./ai";
import {
  findSimilarFeatureRequests,
  formatSimilarFeaturesForClarify,
} from "./feature-similarity";
import { fetchRepoContext, formatRepoContextForPrompt } from "./repo-context";

/** Deducts AI_CREDIT_COSTS.clarify / .prd via chargeFeatureCreditsForJob before AI work. */
export const clarifyFeatureRequest = inngest.createFunction(
  {
    id: "clarify-feature-request",
    triggers: [{ event: "shipflow/feature.clarify" }],
  },
  async ({ event }) => {
    const { featureRequestId } = event.data as { featureRequestId: string };
    const feature = await getFeatureRequest(featureRequestId);
    if (!feature) return shipflowFeatureNotFound();

    const creditError = await chargeFeatureCreditsForJob(
      feature.project.workspaceId,
      AI_CREDIT_COSTS.clarify,
    );
    if (creditError) return shipflowCreditJobFailure(creditError);

    await updateFeatureStatus(featureRequestId, "clarifying");

    const similar = await findSimilarFeatureRequests(
      feature.projectId,
      feature.title,
      featureRequestId,
    );
    const similarContext = formatSimilarFeaturesForClarify(similar);

    // Fetch repo context if a target repository is assigned.
    const targetRepo = feature.targetRepository;
    const repoCtx = targetRepo
      ? await fetchRepoContext(
          targetRepo.installationId,
          targetRepo.repoFullName,
          targetRepo.defaultBranch,
        )
      : null;
    const repoContext = repoCtx ? formatRepoContextForPrompt(repoCtx) : "";

    const questions = await generateClarificationQuestions(
      feature.title,
      feature.description,
      {
        previousMessages: feature.clarifications.map((c) => ({
          role: c.role,
          content: c.content,
        })),
        repoContext,
        similarFeaturesContext: similarContext,
      },
    );

    await addClarification(featureRequestId, "assistant", questions);
    await updateFeatureStatus(featureRequestId, "draft");

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
    if (!feature) return shipflowFeatureNotFound();

    const creditError = await chargeFeatureCreditsForJob(
      feature.project.workspaceId,
      AI_CREDIT_COSTS.prd,
    );
    if (creditError) return shipflowCreditJobFailure(creditError);

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
    await updateFeatureStatus(featureRequestId, "awaiting_prd_approval");

    return { ok: true };
  },
);
