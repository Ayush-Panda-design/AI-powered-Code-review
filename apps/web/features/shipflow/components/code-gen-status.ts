/**
 * Presentation metadata for a task's AI code-generation lifecycle.
 */
export type CodeGenStatusMeta = {
  label: string;
  hint: string;
  className: string;
  dotClassName: string;
};

const META: Record<string, CodeGenStatusMeta> = {
  none: {
    label: "Ready to build",
    hint: "Implement in your IDE, or use optional AI helpers below when you want a draft.",
    className: "text-muted-foreground",
    dotClassName: "bg-muted-foreground/50",
  },
  generating: {
    label: "Working…",
    hint: "ShipFlow is processing this task.",
    className: "text-violet-600",
    dotClassName: "bg-violet-500 animate-pulse",
  },
  code_ready: {
    label: "AI code ready",
    hint: "Review with View code, commit manually in your IDE, or optionally open a draft PR.",
    className: "text-emerald-600",
    dotClassName: "bg-emerald-500",
  },
  draft_pr_open: {
    label: "Draft PR open",
    hint: "Review on GitHub or in View code, then mark the PR Ready when satisfied.",
    className: "text-violet-600",
    dotClassName: "bg-violet-500",
  },
  pr_open: {
    label: "Ready for review",
    hint: "The PR is ready on GitHub — review and merge when it looks good.",
    className: "text-sky-600",
    dotClassName: "bg-sky-500",
  },
  merged: {
    label: "Merged",
    hint: "Code landed in the repo. Move this task to Done.",
    className: "text-emerald-600",
    dotClassName: "bg-emerald-500",
  },
  closed: {
    label: "PR closed",
    hint: "The PR was closed without merging. Re-open work in your IDE or retry optional AI steps.",
    className: "text-muted-foreground",
    dotClassName: "bg-muted-foreground/50",
  },
  failed: {
    label: "AI codegen failed",
    hint: "Optional AI step failed — you can still code in your IDE, or click Regenerate.",
    className: "text-red-600",
    dotClassName: "bg-red-500",
  },
  pr_failed: {
    label: "Draft PR failed",
    hint: "AI code is saved. Fix GitHub permissions, retry Open draft PR, or commit manually in your IDE.",
    className: "text-amber-600",
    dotClassName: "bg-amber-500",
  },
};

export function getCodeGenMeta(status: string | null | undefined): CodeGenStatusMeta {
  return META[status ?? "none"] ?? META.none;
}

const STAGE_INFO: Record<string, { label: string; progress: number }> = {
  queued: { label: "Queued — waiting for the worker", progress: 10 },
  writing_code: { label: "AI is writing the code", progress: 55 },
  opening_pr: { label: "Opening a draft pull request", progress: 80 },
  saving: { label: "Saving and linking the PR", progress: 92 },
};

export function getCodeGenStageInfo(stage: string | null | undefined) {
  return STAGE_INFO[stage ?? "queued"] ?? STAGE_INFO.queued;
}

export function getCodeGenAccent(
  status: string,
): "green" | "amber" | "violet" | "sky" | "muted" {
  switch (status) {
    case "code_ready":
    case "merged":
      return "green";
    case "pr_failed":
    case "failed":
      return "amber";
    case "draft_pr_open":
    case "generating":
      return "violet";
    case "pr_open":
      return "sky";
    default:
      return "muted";
  }
}
