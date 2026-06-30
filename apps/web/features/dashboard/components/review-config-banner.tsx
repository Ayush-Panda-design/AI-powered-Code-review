import { AlertTriangle, Info } from "lucide-react";

import {
  formatReviewConfigError,
  formatReviewConfigWarning,
  isDevelopmentEnvironment,
} from "@/features/dashboard/lib/user-facing-labels";
import {
  getReviewPipelineConfigErrors,
  getReviewPipelineWarnings,
} from "@/features/reviews/server/review-config";

export function ReviewConfigBanner() {
  const errors = getReviewPipelineConfigErrors();
  const warnings = getReviewPipelineWarnings();
  const isDevelopment = isDevelopmentEnvironment();

  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {errors.length > 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">AI reviews are unavailable</p>
            {isDevelopment ? (
              <>
                <p className="text-amber-800 dark:text-amber-300">
                  Add the missing AI keys to your local environment file and
                  restart the dev server:
                </p>
                <ul className="list-disc pl-5 text-amber-800 dark:text-amber-300">
                  {errors.map((error) => (
                    <li key={error}>{formatReviewConfigError(error)}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-amber-800 dark:text-amber-300">
                {formatReviewConfigError(errors[0] ?? "")} Please contact
                support if this continues.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-900 dark:text-sky-200">
          <Info className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">Optional enhancement off</p>
            <ul className="list-disc pl-5 text-sky-800 dark:text-sky-300">
              {warnings.map((warning) => (
                <li key={warning}>{formatReviewConfigWarning(warning)}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
