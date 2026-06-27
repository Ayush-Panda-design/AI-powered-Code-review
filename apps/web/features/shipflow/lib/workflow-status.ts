export function describeWorkflowStatus(status: string) {
  switch (status) {
    case "clarifying":
      return "AI is generating clarification questions for this request.";
    case "prd_generating":
      return "AI is writing the PRD from your feature request.";
    case "planning":
      return "AI is breaking the PRD into engineering tasks.";
    case "fix_needed":
      return "AI flagged blocking issues. Fix and re-review, or approve manually if findings are false positives.";
    case "in_development":
      return "Fixes in progress. Push commits or run re-review when ready.";
    case "in_review":
      return "AI review running against PRD and acceptance criteria.";
    case "release_checking":
      return "AI is assessing release readiness before human approval.";
    case "awaiting_plan_approval":
      return "Engineering plan is ready. Approve the task breakdown to start development.";
    case "awaiting_approval":
      return "No blocking issues. A human can approve or reject release.";
    case "duplicate":
      return "This request looks similar to an existing feature and was marked as a duplicate.";
    default:
      return null;
  }
}

export type WorkflowProgress = {
  step: number;
  totalSteps: number;
  stepLabel: string;
  description: string;
  inFlight: boolean;
};

export function getWorkflowProgress(status: string): WorkflowProgress | null {
  const inFlightMap: Record<string, Omit<WorkflowProgress, "inFlight">> = {
    clarifying: {
      step: 1,
      totalSteps: 4,
      stepLabel: "AI clarify",
      description: "Generating clarification questions…",
    },
    prd_generating: {
      step: 2,
      totalSteps: 4,
      stepLabel: "Generate PRD",
      description: "Drafting product requirements…",
    },
    planning: {
      step: 3,
      totalSteps: 4,
      stepLabel: "Generate tasks",
      description: "Breaking PRD into engineering tasks…",
    },
    in_review: {
      step: 4,
      totalSteps: 5,
      stepLabel: "AI review",
      description: "Reviewing linked PR against PRD…",
    },
    release_checking: {
      step: 5,
      totalSteps: 5,
      stepLabel: "Release readiness",
      description: "Checking PRD, tasks, and review findings…",
    },
  };

  const inFlight = inFlightMap[status];
  if (inFlight) {
    return { ...inFlight, inFlight: true };
  }

  const description = describeWorkflowStatus(status);
  if (!description) {
    return null;
  }

  return {
    step: 0,
    totalSteps: 4,
    stepLabel: "Delivery loop",
    description,
    inFlight: false,
  };
}
