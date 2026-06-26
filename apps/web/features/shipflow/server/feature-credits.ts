import {
  AI_CREDIT_COSTS,
  resolveWorkspaceIdForFeature,
  tryConsumeCredits,
  type CreditConsumptionFailure,
} from "@repo/services";

export async function consumeFeatureCreditsForJob(
  featureRequestId: string,
  cost: number,
) {
  const workspaceId = await resolveWorkspaceIdForFeature(featureRequestId);
  return tryConsumeCredits(workspaceId, cost);
}

export function creditFailureToJobResult(failure: CreditConsumptionFailure) {
  return {
    ok: false as const,
    error: failure.code,
    message: failure.message,
  };
}

export { AI_CREDIT_COSTS };
