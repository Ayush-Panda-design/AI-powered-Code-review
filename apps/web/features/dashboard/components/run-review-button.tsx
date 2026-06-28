"use client";

import { Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LoadingIllustration } from "@/components/ui/loading-illustration";
import {
  getStaleProcessingMs,
  isInFlightPrStatus,
} from "@repo/services/constants";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";

type RunReviewButtonProps = {
  pullRequestId: string;
  status: string;
  updatedAt: string;
  disabled?: boolean;
  label?: string;
  className?: string;
  compact?: boolean;
};

function isStaleInFlight(status: string, updatedAt: string) {
  if (!isInFlightPrStatus(status)) {
    return false;
  }

  return Date.now() - new Date(updatedAt).getTime() >= getStaleProcessingMs();
}

export function RunReviewButton({
  pullRequestId,
  status,
  updatedAt,
  disabled = false,
  label = "Review",
  className,
  compact = false,
}: RunReviewButtonProps) {
  const utils = trpc.useUtils();
  const inFlight = isInFlightPrStatus(status) && !isStaleInFlight(status, updatedAt);
  const isReviewed =
    status === "reviewed" || status === "completed";
  const isRetry =
    status === "failed" || isStaleInFlight(status, updatedAt);

  const runReview = trpc.review.runReview.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
      await Promise.all([
        utils.review.list.invalidate(),
        utils.review.history.invalidate(),
        utils.review.getStatus.invalidate({ pullRequestId }),
        utils.featureRequest.get.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const buttonLabel = runReview.isPending
    ? "Queuing"
    : inFlight
      ? "Running"
      : isRetry
        ? "Retry"
        : compact && isReviewed
          ? "Re-run"
          : label;

  return (
    <Button
      type="button"
      variant={compact && isReviewed && !isRetry ? "ghost" : "outline"}
      size="xs"
      disabled={disabled || runReview.isPending || inFlight}
      onClick={() => runReview.mutate({ pullRequestId })}
      className={cn(
        compact ? "h-7 w-fit gap-1.5 px-2 text-xs" : "w-full",
        compact && isReviewed && !isRetry && "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {inFlight || runReview.isPending ? (
        <LoadingIllustration variant="inline" size="sm" />
      ) : isRetry || (compact && isReviewed) ? (
        <RotateCcw className="size-3" />
      ) : (
        <Play className="size-3" />
      )}
      {buttonLabel}
    </Button>
  );
}
