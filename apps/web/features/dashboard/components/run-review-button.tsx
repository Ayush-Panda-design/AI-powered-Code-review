"use client";

import { Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";

type RunReviewButtonProps = {
  pullRequestId: string;
  disabled?: boolean;
  label?: string;
};

export function RunReviewButton({
  pullRequestId,
  disabled = false,
  label = "Run review",
}: RunReviewButtonProps) {
  const utils = trpc.useUtils();
  const runReview = trpc.review.runReview.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
      await utils.featureRequest.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || runReview.isPending}
      onClick={() => runReview.mutate({ pullRequestId })}
    >
      <Play />
      {runReview.isPending ? "Queuing…" : label}
    </Button>
  );
}
