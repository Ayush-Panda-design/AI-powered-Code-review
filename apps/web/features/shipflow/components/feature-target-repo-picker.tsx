"use client";

import { GitFork, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/trpc/client";

type Repo = {
  id: string;
  repoFullName: string;
  defaultBranch: string;
};

type FeatureTargetRepoPickerProps = {
  featureRequestId: string;
  connectedRepos: Repo[];
  targetRepository: Repo | null;
  onChanged?: () => void;
};

export function FeatureTargetRepoPicker({
  featureRequestId,
  connectedRepos,
  targetRepository,
  onChanged,
}: FeatureTargetRepoPickerProps) {
  const utils = trpc.useUtils();

  const setRepo = trpc.featureRequest.setTargetRepository.useMutation({
    onSuccess: async () => {
      toast.success("Target repository updated. AI will write code there.");
      await utils.featureRequest.get.invalidate({ id: featureRequestId });
      onChanged?.();
    },
    onError: (e) => toast.error(e.message),
  });

  if (connectedRepos.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
        <GitFork className="size-3.5 shrink-0" />
        No repositories connected to this project yet. Go to{" "}
        <a href="/dashboard/repositories" className="underline hover:no-underline">
          Repositories
        </a>{" "}
        to connect one.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <GitFork className="size-3.5" />
        Target repository for AI code generation
      </p>
      <div className="flex flex-wrap gap-2">
        {connectedRepos.map((repo) => {
          const isSelected = targetRepository?.id === repo.id;
          return (
            <button
              key={repo.id}
              type="button"
              disabled={setRepo.isPending}
              onClick={() =>
                setRepo.mutate({
                  featureRequestId,
                  repositoryId: isSelected ? null : repo.id,
                })
              }
              className={[
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                setRepo.isPending ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {isSelected && <Check className="size-3" />}
              {repo.repoFullName}
              <span className="text-[10px] opacity-60">({repo.defaultBranch})</span>
              {isSelected && (
                <span className="ml-1 rounded bg-primary/20 px-1 text-[10px] font-normal text-primary">
                  selected
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!targetRepository && connectedRepos.length > 1 && (
        <p className="text-[11px] text-amber-600">
          ⚠ No target repo selected — AI will pick the first connected repo automatically.
          Choose one above so AI always writes to the right place.
        </p>
      )}
      {!targetRepository && connectedRepos.length === 1 && (
        <p className="text-[11px] text-muted-foreground">
          Only one repo connected — AI will use <strong>{connectedRepos[0]?.repoFullName}</strong> automatically.
        </p>
      )}
      {targetRepository && (
        <p className="text-[11px] text-muted-foreground">
          AI code generation will target <strong>{targetRepository.repoFullName}</strong> (branch: {targetRepository.defaultBranch}).
          Click it again to deselect.
        </p>
      )}
    </div>
  );
}
