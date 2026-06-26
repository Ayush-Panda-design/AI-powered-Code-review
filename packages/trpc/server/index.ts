import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { workspaceRouter } from "./routes/workspace/route";
import { projectRouter } from "./routes/project/route";
import { featureRequestRouter } from "./routes/feature-request/route";
import { taskRouter } from "./routes/task/route";
import { shipflowRouter } from "./routes/shipflow/route";
import { reviewRouter } from "./routes/review/route";

export const serverRouter = router({
  health: healthRouter,
  workspace: workspaceRouter,
  project: projectRouter,
  featureRequest: featureRequestRouter,
  task: taskRouter,
  shipflow: shipflowRouter,
  review: reviewRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
