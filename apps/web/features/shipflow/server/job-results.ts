export type ShipflowJobFailure = {
  ok: false;
  error: string;
  message?: string;
};

export type ShipflowJobSuccess<T extends Record<string, unknown> = Record<string, never>> = {
  ok: true;
} & T;

export const SHIPFLOW_JOB_ERRORS = {
  feature_not_found: "Feature request not found.",
  prd_not_found: "Requirements not found for this feature.",
} as const;

export function shipflowJobFailure(
  error: string,
  message?: string,
): ShipflowJobFailure {
  return message ? { ok: false, error, message } : { ok: false, error };
}

export function shipflowJobSuccess<T extends Record<string, unknown>>(
  data?: T,
): ShipflowJobSuccess<T> {
  return { ok: true, ...data } as ShipflowJobSuccess<T>;
}

export function shipflowFeatureNotFound(): ShipflowJobFailure {
  return shipflowJobFailure(
    "feature_not_found",
    SHIPFLOW_JOB_ERRORS.feature_not_found,
  );
}

export function shipflowPrdNotFound(): ShipflowJobFailure {
  return shipflowJobFailure("prd_not_found", SHIPFLOW_JOB_ERRORS.prd_not_found);
}

export function shipflowCreditJobFailure(creditError: {
  error: string;
  message: string;
}): ShipflowJobFailure {
  return shipflowJobFailure(creditError.error, creditError.message);
}
