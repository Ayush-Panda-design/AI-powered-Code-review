import { inngest } from "@/features/inngest/client";
import {
  addClarification,
  getFeatureRequest,
  updateFeatureStatus,
} from "@repo/services";
import { generateText } from "ai";

import { getReviewModel, getReviewMaxOutputTokens } from "@/features/ai-sdk";
import {
  shipflowFeatureNotFound,
} from "@/features/shipflow/server/job-results";

const READINESS_SYSTEM = `You are ShipFlow's release readiness agent. Assess whether a feature is ready for human final approval.

Consider: PRD completeness, task coverage, latest AI review findings, linked PR status.

Respond with a concise readiness summary (3-6 sentences) and a clear READY or NOT READY verdict on the first line.`;

export const checkReleaseReadiness = inngest.createFunction(
  {
    id: "check-release-readiness",
    triggers: [{ event: "shipflow/release.readiness" }],
  },
  async ({ event }) => {
    const { featureRequestId } = event.data as { featureRequestId: string };
    const feature = await getFeatureRequest(featureRequestId);
    if (!feature) return shipflowFeatureNotFound();

    await updateFeatureStatus(featureRequestId, "release_checking");

    const latestReview = feature.aiReviews[0];
    const tasksSummary = feature.tasks
      .map((task) => `- [${task.status}] ${task.title}`)
      .join("\n");

    const model = getReviewModel();
    const { text } = await generateText({
      model,
      maxOutputTokens: getReviewMaxOutputTokens(),
      system: READINESS_SYSTEM,
      prompt: [
        `Feature: ${feature.title}`,
        `Status: ${feature.status}`,
        `PRD: ${feature.prd ? "present" : "missing"}`,
        `Tasks:\n${tasksSummary || "none"}`,
        latestReview
          ? `Latest AI review: ${latestReview.blockingCount} blocking, ${latestReview.nonBlockingCount} non-blocking\n${latestReview.summary}`
          : "No AI review yet",
        `Linked PRs: ${feature.pullRequests.length}`,
      ].join("\n\n"),
    });

    await addClarification(featureRequestId, "assistant", text.trim());
    await updateFeatureStatus(featureRequestId, "awaiting_approval");

    return { ok: true, assessment: text.trim() };
  },
);
