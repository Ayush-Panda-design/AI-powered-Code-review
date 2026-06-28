"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoadingIllustration } from "@/components/ui/loading-illustration";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";

type SyncStatus = {
  id: string;
  status: "running" | "completed" | "failed";
  totalRepos: number;
  completedRepos: number;
  totalPRs: number;
  completedPRs: number;
  syncedPRs: number;
  changedPRs: number;
  queuedReviews: number;
  errorMessage: string | null;
  message: string | null;
};

/** Expected time for a full sync — used to pace the client-side animation. */
const EXPECTED_SYNC_MS = 20_000;

function friendlySyncError(raw?: string | null) {
  if (raw && /timed out/i.test(raw)) {
    return "Sync took too long and was stopped. Please try again.";
  }
  if (raw && /(could not start|inngest|background sync)/i.test(raw)) {
    return "Background sync didn't start. Run pnpm inngest:dev in a second terminal, then try again.";
  }
  if (raw && /(rate limit|secondary rate)/i.test(raw)) {
    return "GitHub rate limit reached. Wait a minute, then try again.";
  }
  if (raw && /(not connected|installation|token|credential|auth)/i.test(raw)) {
    return "We couldn't reach GitHub. Reconnect the GitHub App and try again.";
  }
  return "Sync couldn't finish. Please try again in a moment.";
}

function formatRunningText(status: SyncStatus) {
  if (status.totalRepos === 0) {
    return "Starting sync…";
  }
  if (status.completedRepos === 0) {
    return `Checking ${status.totalRepos} repos…`;
  }
  if (status.completedRepos < status.totalRepos) {
    const remaining = status.totalRepos - status.completedRepos;
    return `${status.completedRepos} of ${status.totalRepos} repos done · ${remaining} remaining`;
  }
  return "Wrapping up…";
}

function SyncProgressPanel({
  status,
  displayPercent,
  className,
}: {
  status: SyncStatus;
  displayPercent: number;
  className?: string;
}) {
  const isRunning = status.status === "running";
  const isCompleted = status.status === "completed";
  const isFailed = status.status === "failed";

  const text =
    isCompleted || isFailed
      ? (status.message ?? (isFailed ? friendlySyncError(status.errorMessage) : "Sync complete."))
      : formatRunningText(status);

  return (
    <div
      className={cn(
        "w-full max-w-md rounded-lg border px-4 py-3",
        isRunning &&
          "border-amber-500/30 bg-amber-500/5 dark:border-amber-400/20 dark:bg-amber-500/10",
        isCompleted &&
          "border-emerald-500/30 bg-emerald-500/5 dark:border-emerald-400/20 dark:bg-emerald-500/10",
        isFailed && "border-destructive/30 bg-destructive/5 dark:bg-destructive/10",
        className,
      )}
    >
      <div className={cn("flex items-center gap-3", isRunning ? "mb-3" : "")}>
        {isRunning ? (
          <LoadingIllustration variant="repos" size="sm" label="Syncing" />
        ) : isCompleted ? (
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <XCircle className="size-4 shrink-0 text-destructive" />
        )}
        <p
          className={cn(
            "text-sm font-medium",
            isRunning && "text-amber-800 dark:text-amber-300",
            isCompleted && "text-emerald-800 dark:text-emerald-300",
            isFailed && "text-destructive",
          )}
        >
          {text}
        </p>
      </div>

      {isRunning ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">GitHub sync</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {displayPercent}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            {/* Indeterminate sweep when we don't have real repo count yet */}
            {status.totalRepos === 0 ? (
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 animate-[sweep_1.4s_ease-in-out_infinite]" />
            ) : (
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700 ease-out"
                style={{ width: `${displayPercent}%` }}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SyncPullRequestsButton({
  className,
}: {
  className?: string;
}) {
  const utils = trpc.useUtils();
  const [syncId, setSyncId] = useState<string | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [displayPercent, setDisplayPercent] = useState(0);
  const syncStartRef = useRef<number | null>(null);

  const { data: activeSync } = trpc.review.getActiveSync.useQuery(undefined, {
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (activeSync?.active && !syncId) {
      setSyncId(activeSync.status.id);
    }
  }, [activeSync, syncId]);

  const { data: syncStatus } = trpc.review.getSyncStatus.useQuery(
    { syncId: syncId ?? "" },
    {
      enabled: Boolean(syncId),
      // Poll quickly while running so we catch intermediate updates
      refetchInterval: (query) =>
        query.state.data?.status === "running" ? 600 : false,
    },
  );

  const startSync = trpc.review.startSync.useMutation({
    onSuccess: (result) => {
      setSyncId(result.syncId);
      setDismissedId(null);
      void utils.review.getActiveSync.invalidate();
    },
  });

  // Derive whether we're in an active sync (either pending mutation or running job)
  const isRunning =
    startSync.isPending || syncStatus?.status === "running";

  // The status object shown in the panel — visible immediately on button click
  const panelStatus: SyncStatus | null =
    syncStatus ??
    (startSync.isPending
      ? {
          id: "pending",
          status: "running",
          totalRepos: 0,
          completedRepos: 0,
          totalPRs: 0,
          completedPRs: 0,
          syncedPRs: 0,
          changedPRs: 0,
          queuedReviews: 0,
          errorMessage: null,
          message: null,
        }
      : null);

  const showPanel =
    panelStatus !== null && panelStatus.id !== dismissedId;

  // Smooth progress animation — updates every 200 ms
  useEffect(() => {
    if (!isRunning) {
      if (syncStatus?.status === "completed") {
        setDisplayPercent(100);
      } else if (!syncStatus) {
        setDisplayPercent(0);
      }
      syncStartRef.current = null;
      return;
    }

    if (!syncStartRef.current) {
      syncStartRef.current = Date.now();
    }

    const tick = () => {
      const elapsed = Date.now() - (syncStartRef.current ?? Date.now());
      // Time-based estimate: 0 → 90% over EXPECTED_SYNC_MS
      const timePct = Math.min(90, (elapsed / EXPECTED_SYNC_MS) * 90);
      // Real data from DB (only meaningful once totalRepos is set)
      const realPct =
        syncStatus && syncStatus.totalRepos > 0
          ? Math.round((syncStatus.completedRepos / syncStatus.totalRepos) * 100)
          : 0;
      // Use whichever is higher so the bar never goes backward
      const next = Math.round(Math.max(timePct, realPct));
      setDisplayPercent((prev) => Math.max(prev, next));
    };

    tick(); // immediate call so bar moves on first render
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [isRunning, syncStatus]);

  // Refresh PR list when sync completes
  useEffect(() => {
    if (syncStatus?.status === "completed") {
      void utils.review.list.invalidate();
      void utils.review.getActiveSync.invalidate();
    }
  }, [syncStatus?.status, utils.review.list, utils.review.getActiveSync]);

  return (
    <div className={cn("flex flex-col items-end gap-3", className)}>
      <Button
        type="button"
        variant="outline"
        disabled={isRunning}
        onClick={() => {
          setDisplayPercent(0);
          syncStartRef.current = null;
          startSync.mutate();
        }}
      >
        {isRunning ? (
          <LoadingIllustration variant="inline" size="sm" label="Syncing" />
        ) : (
          <RefreshCw />
        )}
        Sync from GitHub
      </Button>

      {showPanel ? (
        <div className="flex w-full flex-col items-end gap-2">
          <SyncProgressPanel
            status={panelStatus}
            displayPercent={displayPercent}
          />
          {panelStatus.status !== "running" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setDismissedId(panelStatus.id)}
            >
              Dismiss
            </Button>
          ) : null}
        </div>
      ) : null}

      {startSync.error ? (
        <p className="max-w-md text-right text-xs text-destructive">
          {friendlySyncError(startSync.error.message)}
        </p>
      ) : null}
    </div>
  );
}
