import { inngest } from "@/features/inngest/client";
import { downgradeExpiredSubscriptions } from "@repo/services";

export const checkExpiredSubscriptions = inngest.createFunction(
  {
    id: "check-expired-subscriptions",
    triggers: [{ cron: "0 3 * * *" }],
  },
  async ({ step }) => {
    return step.run("downgrade-expired-pro-plans", downgradeExpiredSubscriptions);
  },
);
