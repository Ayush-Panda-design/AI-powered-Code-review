"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ButtonLoadingLabel, LoadingIllustration } from "@/components/ui/loading-illustration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DASHBOARD_BASE_PATH } from "@/features/dashboard/lib/routes";
import { RunReviewButton } from "@/features/dashboard/components/run-review-button";
import { trpc } from "@/trpc/client";

type PrLinkPanelProps = {
  featureRequestId: string;
  linkedPullRequests: Array<{
    id: string;
    repoFullName: string;
    prNumber: number;
    title: string;
    status: string;
    updatedAt: string;
  }>;
  reviewConfigured?: boolean;
  onUpdated: () => Promise<void>;
};

function LinkablePrEmptyState({
  emptyReason,
  connectedRepos,
}: {
  emptyReason: "no_connected_repos" | "no_synced_prs" | "all_linked" | null | undefined;
  connectedRepos: string[];
}) {
  if (emptyReason === "no_connected_repos") {
    return (
      <div className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">No repositories connected to this project</p>
        <p className="mt-1 text-xs">
          Connect repos under{" "}
          <Link href={`${DASHBOARD_BASE_PATH}/repositories`} className="text-primary underline">
            Repositories
          </Link>{" "}
          (they must belong to the same project as this feature).
        </p>
      </div>
    );
  }

  if (emptyReason === "no_synced_prs") {
    return (
      <div className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">No pull requests synced yet</p>
        <p className="mt-1 text-xs">
          Open a PR on GitHub in{" "}
          {connectedRepos.length > 0 ? connectedRepos.join(", ") : "a connected repo"}, then click{" "}
          <strong>Sync from GitHub</strong> above (or on the{" "}
          <Link href={`${DASHBOARD_BASE_PATH}/pull-requests`} className="text-primary underline">
            Pull Requests
          </Link>{" "}
          page). Auto-link works when the branch is{" "}
          <code>feature/&lt;feature-id&gt;</code> or the title includes{" "}
          <code>[shipflow:&lt;feature-id&gt;]</code>.
        </p>
      </div>
    );
  }

  if (emptyReason === "all_linked") {
    return (
      <div className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">All synced PRs are already linked</p>
        <p className="mt-1 text-xs">
          Open a new PR in {connectedRepos.join(", ")} and sync, or unlink a PR from another
          feature first.
        </p>
      </div>
    );
  }

  return null;
}

export function PrLinkPanel({
  featureRequestId,
  linkedPullRequests,
  reviewConfigured = true,
  onUpdated,
}: PrLinkPanelProps) {
  const [selectedPrId, setSelectedPrId] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInFlightRef = useRef(false);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.featureRequest.listLinkablePullRequests.useQuery(
    { featureRequestId },
    {
      // Live: pick up PRs synced via webhook, manual sync, or auto-sync.
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    },
  );

  const linkable = data?.pullRequests ?? [];
  const emptyReason = data?.emptyReason;
  const connectedRepos = data?.connectedRepos ?? [];

  const runSync = useCallback(
    async (options?: { silent?: boolean }) => {
      if (syncInFlightRef.current) {
        return;
      }
      syncInFlightRef.current = true;
      setIsSyncing(true);
      const toastId = `sync-feature-${featureRequestId}`;
      if (!options?.silent) {
        toast.loading("Connecting to GitHub…", { id: toastId });
      }
      try {
        const response = await fetch("/api/github/sync-feature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ featureRequestId }),
        });

        const result = (await response.json().catch(() => null)) as {
          ok?: boolean;
          changed?: number;
          synced?: number;
          repos?: number;
          failedRepos?: number;
          reason?: string;
          error?: string;
        } | null;

        if (!response.ok || !result?.ok) {
          throw new Error(result?.error ?? "Sync failed");
        }

        await Promise.all([
          utils.featureRequest.listLinkablePullRequests.invalidate({
            featureRequestId,
          }),
          onUpdated(),
        ]);

        if (!options?.silent) {
          toast.dismiss(toastId);
          if (result.reason === "no_connected_repos" || (result.repos ?? 0) === 0) {
            toast.info("No repositories connected to this feature's project.");
          } else if ((result.failedRepos ?? 0) > 0 && (result.changed ?? 0) === 0) {
            toast.error(
              "Could not reach GitHub for connected repos. Check the GitHub App installation.",
            );
          } else if ((result.changed ?? 0) > 0) {
            toast.success(`Synced — ${result.changed} pull request(s) updated.`);
          } else {
            toast.success("Up to date with GitHub.");
          }
        }
      } catch (error) {
        if (!options?.silent) {
          toast.dismiss(toastId);
          toast.error(
            error instanceof Error ? error.message : "Failed to sync from GitHub",
          );
        }
      } finally {
        syncInFlightRef.current = false;
        setIsSyncing(false);
      }
    },
    [featureRequestId, onUpdated, utils],
  );

  // One silent sync per browser session (survives React Strict Mode remounts).
  useEffect(() => {
    const key = `shipflow:auto-sync:${featureRequestId}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key)) {
      return;
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem(key, "1");
    }
    void runSync({ silent: true });
  }, [featureRequestId, runSync]);

  const linkMutation = trpc.featureRequest.linkPullRequest.useMutation({
    onSuccess: async (result) => {
      toast.success(
        result.reviewQueued
          ? "Pull request linked — AI review started"
          : "Pull request linked",
      );
      setSelectedPrId("");
      await Promise.all([
        utils.featureRequest.listLinkablePullRequests.invalidate({
          featureRequestId,
        }),
        onUpdated(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const unlinkMutation = trpc.featureRequest.unlinkPullRequest.useMutation({
    onSuccess: async () => {
      toast.success("Pull request unlinked");
      await Promise.all([
        utils.featureRequest.listLinkablePullRequests.invalidate({
          featureRequestId,
        }),
        onUpdated(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Pull requests</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isSyncing}
          onClick={() => void runSync()}
          className="gap-1.5"
        >
          <RefreshCw className={isSyncing ? "size-3.5 animate-spin" : "size-3.5"} />
          {isSyncing ? "Syncing…" : "Sync from GitHub"}
        </Button>
      </CardHeader>
      {isSyncing ? (
        <div className="mx-6 mb-2 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
          <LoadingIllustration variant="repos" size="sm" label="Syncing" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
              Syncing with GitHub…
            </p>
            <p className="text-[11px] text-muted-foreground">
              Fetching open pull requests from your connected repos
            </p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/3 animate-[sweep_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
            </div>
          </div>
        </div>
      ) : null}
      <CardContent className="space-y-4">
        {linkedPullRequests.length > 0 ? (
          <div className="space-y-2">
            {linkedPullRequests.map((pr) => (
              <div
                key={pr.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate" title={`${pr.repoFullName} #${pr.prNumber} — ${pr.title}`}>
                  {pr.repoFullName} #{pr.prNumber} — {pr.title}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="capitalize text-xs text-muted-foreground">
                    {pr.status}
                  </span>
                  <RunReviewButton
                    pullRequestId={pr.id}
                    status={pr.status}
                    updatedAt={pr.updatedAt}
                    disabled={!reviewConfigured}
                    compact
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={unlinkMutation.isPending}
                    onClick={() =>
                      unlinkMutation.mutate({ pullRequestId: pr.id })
                    }
                  >
                    Unlink
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No pull requests linked yet.
          </p>
        )}

        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium">Link pull request manually</p>
          <p className="text-xs text-muted-foreground">
            Auto-link via branch <code>feature/{featureRequestId}</code> or title{" "}
            <code>[shipflow:{featureRequestId}]</code>, or pick from connected repos:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {isLoading ? (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <LoadingIllustration variant="pull-requests" size="sm" />
                Loading open PRs…
              </span>
            ) : linkable.length > 0 ? (
              <>
                <Select
                  value={selectedPrId}
                  onValueChange={(value) => {
                    if (value) setSelectedPrId(value);
                  }}
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Select a pull request" />
                  </SelectTrigger>
                  <SelectContent>
                    {linkable.map((pr) => (
                      <SelectItem key={pr.id} value={pr.id}>
                        {pr.repoFullName} #{pr.prNumber} — {pr.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedPrId || linkMutation.isPending}
                  onClick={() =>
                    linkMutation.mutate({
                      featureRequestId,
                      pullRequestId: selectedPrId,
                    })
                  }
                >
                  {linkMutation.isPending ? (
                    <ButtonLoadingLabel>Linking…</ButtonLoadingLabel>
                  ) : (
                    "Link PR"
                  )}
                </Button>
              </>
            ) : isSyncing ? (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <LoadingIllustration variant="pull-requests" size="sm" />
                Checking GitHub for open pull requests…
              </span>
            ) : (
              <LinkablePrEmptyState
                emptyReason={emptyReason}
                connectedRepos={connectedRepos}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
