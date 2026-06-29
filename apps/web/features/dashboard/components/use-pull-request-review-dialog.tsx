"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PullRequestReviewDialog } from "@/features/dashboard/components/pull-request-review-dialog";

export type PullRequestReviewTarget = {
  pullRequestId: string;
  title?: string;
  repoFullName?: string;
  prNumber?: number;
  reviewComment?: string | null;
  status?: string;
};

type ReviewDetail = {
  title: string;
  repoFullName: string;
  prNumber: number;
  reviewComment: string | null;
  status: string;
};

async function fetchReviewDetail(pullRequestId: string): Promise<ReviewDetail> {
  const input = encodeURIComponent(
    JSON.stringify({ json: { pullRequestId } }),
  );
  const res = await fetch(
    `/api/trpc/review.getPullRequestReviewDetail?input=${input}`,
    { credentials: "include" },
  );
  if (!res.ok) {
    throw new Error("Could not load review details.");
  }
  const body = (await res.json()) as {
    result?: { data?: { json?: ReviewDetail } };
  };
  const detail = body.result?.data?.json;
  if (!detail) {
    throw new Error("Review details were not found.");
  }
  return detail;
}

export function usePullRequestReviewDialog() {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<PullRequestReviewTarget | null>(null);

  const needsFetch =
    open &&
    Boolean(target?.pullRequestId) &&
    !target?.reviewComment;

  const { data: fetched, isLoading } = useQuery({
    queryKey: ["review-detail", target?.pullRequestId],
    queryFn: () => fetchReviewDetail(target!.pullRequestId),
    enabled: needsFetch,
  });

  const openReview = useCallback((next: PullRequestReviewTarget) => {
    setTarget(next);
    setOpen(true);
  }, []);

  const closeReview = useCallback(() => {
    setOpen(false);
    setTarget(null);
  }, []);

  const title = target?.title ?? fetched?.title ?? "Pull request";
  const repoFullName = target?.repoFullName ?? fetched?.repoFullName ?? "";
  const prNumber = target?.prNumber ?? fetched?.prNumber ?? 0;
  const reviewComment = target?.reviewComment ?? fetched?.reviewComment ?? null;
  const status = target?.status ?? fetched?.status ?? "pending";

  const dialog = target ? (
    <PullRequestReviewDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeReview();
          return;
        }
        setOpen(true);
      }}
      title={title}
      repoFullName={repoFullName}
      prNumber={prNumber}
      reviewComment={reviewComment}
      status={status}
      isLoading={isLoading && needsFetch}
    />
  ) : null;

  return { openReview, dialog };
}
