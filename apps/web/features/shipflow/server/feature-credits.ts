import {
  tryConsumeCredits,
  type CreditConsumptionFailure,
} from "@repo/services";

export type FeatureJobCreditError = {
  ok: false;
  error: CreditConsumptionFailure["code"];
  message: string;
};

/** Consume credits only after the caller has verified the feature request exists. */
export async function consumeFeatureCreditsForJob(
  workspaceId: string,
  cost: number,
): Promise<CreditConsumptionFailure | null> {
  if (!workspaceId?.trim()) {
    return {
      code: "workspace_not_found",
      message: "Workspace not found for this feature request.",
    };
  }

  return tryConsumeCredits(workspaceId, cost);
}

export function creditFailureToJobResult(
  failure: CreditConsumptionFailure,
): FeatureJobCreditError {
  return {
    ok: false,
    error: failure.code,
    message: failure.message,
  };
}

/** Charge credits for an Inngest job; returns a job error payload or null on success. */
export async function chargeFeatureCreditsForJob(
  workspaceId: string,
  cost: number,
): Promise<FeatureJobCreditError | null> {
  const failure = await consumeFeatureCreditsForJob(workspaceId, cost);
  return failure ? creditFailureToJobResult(failure) : null;
}
