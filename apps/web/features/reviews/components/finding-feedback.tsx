"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ReviewFinding } from "@/features/reviews/types/structured-review";
import { trpc } from "@/trpc/client";

type FindingFeedbackProps = {
  reviewId: string;
  finding: ReviewFinding;
};

export function FindingFeedback({ reviewId, finding }: FindingFeedbackProps) {
  const [submitted, setSubmitted] = useState<"helpful" | "false_positive" | null>(
    null,
  );
  const utils = trpc.useUtils();

  const feedback = trpc.review.submitFindingFeedback.useMutation({
    onSuccess: async (_result, variables) => {
      setSubmitted(variables.feedback);
      toast.success(
        variables.feedback === "false_positive"
          ? "Marked false positive — future reviews will suppress similar findings"
          : "Thanks for the feedback",
      );
      await utils.featureRequest.get.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (submitted) {
    return (
      <p className="text-xs text-muted-foreground">
        Feedback recorded ({submitted === "false_positive" ? "false positive" : "helpful"})
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
      <span className="text-xs text-muted-foreground">Was this finding useful?</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        disabled={feedback.isPending}
        onClick={() =>
          feedback.mutate({
            reviewId,
            findingId: finding.id,
            feedback: "helpful",
          })
        }
      >
        <ThumbsUp className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        disabled={feedback.isPending}
        onClick={() =>
          feedback.mutate({
            reviewId,
            findingId: finding.id,
            feedback: "false_positive",
            reason: `False positive: ${finding.title}`,
          })
        }
      >
        <ThumbsDown className="size-3.5" />
        False positive
      </Button>
    </div>
  );
}
