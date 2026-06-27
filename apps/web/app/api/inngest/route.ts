import { serve } from "inngest/next";

import { inngest } from "@/features/inngest/client";
import { reviewPullRequest } from "@/features/reviews/server/review-pr-function";
import { checkStalePullRequests } from "@/features/reviews/server/stale-pr-cron";
import {
  clarifyFeatureRequest,
  generatePrd,
} from "@/features/shipflow/server/inngest-functions";
import { generateTaskCode } from "@/features/shipflow/server/codegen-inngest";
import { checkReleaseReadiness } from "@/features/shipflow/server/release-readiness-function";
import { generateTasks } from "@/features/shipflow/server/task-inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    reviewPullRequest,
    clarifyFeatureRequest,
    generatePrd,
    generateTasks,
    checkReleaseReadiness,
    generateTaskCode,
    checkStalePullRequests,
  ],
});
