import { serve } from "inngest/next";

import { inngest } from "@/features/inngest/client";
import { reviewPullRequest } from "@/features/reviews/server/review-pr-function";
import {
  clarifyFeatureRequest,
  generatePrd,
} from "@/features/shipflow/server/inngest-functions";
import { generateTasks } from "@/features/shipflow/server/task-inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    reviewPullRequest,
    clarifyFeatureRequest,
    generatePrd,
    generateTasks,
  ],
});
