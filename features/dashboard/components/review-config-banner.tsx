import { AlertTriangle } from "lucide-react";

import { getReviewPipelineConfigErrors } from "@/features/reviews/server/review-config";

export function ReviewConfigBanner() {
  const errors = getReviewPipelineConfigErrors();

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">AI review is not configured</p>
        <p className="text-amber-800 dark:text-amber-300">
          Add these to your <code>.env</code> file and restart the dev server:
        </p>
        <ul className="list-disc pl-5 text-amber-800 dark:text-amber-300">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
