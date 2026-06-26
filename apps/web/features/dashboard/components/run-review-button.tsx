"use client";

import { Play } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { runPullRequestReview } from "@/lib/actions/reviews";

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
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await runPullRequestReview(pullRequestId);
          if (result.ok) {
            toast.success(result.message);
          } else {
            toast.error(result.message);
          }
        });
      }}
    >
      <Play />
      {isPending ? "Queuing…" : label}
    </Button>
  );
}
