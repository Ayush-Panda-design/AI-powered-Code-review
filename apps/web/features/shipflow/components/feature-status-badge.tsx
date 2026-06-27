import { cn } from "@/lib/utils";
import { FEATURE_STATUS_LABELS } from "@/features/dashboard/lib/routes";

const statusStyles: Record<string, string> = {
  draft: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300",
  clarifying: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  prd_generating: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  prd_ready: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  planning: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  awaiting_plan_approval: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  in_development: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  in_review: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  release_checking: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  fix_needed: "bg-red-500/15 text-red-700 dark:text-red-300",
  awaiting_approval: "bg-yellow-500/15 text-yellow-800 dark:text-yellow-200",
  shipped: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-red-500/15 text-red-600",
  duplicate: "bg-zinc-500/15 text-zinc-500",
};

export function FeatureStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status] ?? statusStyles.draft,
      )}
    >
      {FEATURE_STATUS_LABELS[status] ?? status}
    </span>
  );
}
