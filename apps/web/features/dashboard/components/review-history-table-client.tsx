"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DASHBOARD_BASE_PATH } from "@/features/dashboard/lib/routes";
import { confidenceLabel } from "@/features/reviews/types/structured-review";
import { isInFlightPrStatus } from "@repo/services/constants";
import { trpc } from "@/trpc/client";

export function ReviewHistoryTableClient() {
  const { data: listData } = trpc.review.list.useQuery(undefined, {
    refetchInterval: 4000,
  });

  const hasInFlight = (listData?.pullRequests ?? []).some((pullRequest) =>
    isInFlightPrStatus(pullRequest.status),
  );

  const { data, isLoading } = trpc.review.history.useQuery(undefined, {
    refetchInterval: hasInFlight ? 4000 : false,
  });

  if (isLoading && !data) {
    return <p className="text-sm text-muted-foreground">Loading review history…</p>;
  }

  if (!data?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GitHub App not connected</CardTitle>
          <CardDescription>
            Install the GitHub App to see AI review history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`${DASHBOARD_BASE_PATH}/github-app`} className="text-sm underline">
            Connect GitHub App
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (data.reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {hasInFlight
          ? "Review in progress — results will appear here when complete."
          : "No AI reviews yet."}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Repository</TableHead>
          <TableHead>PR</TableHead>
          <TableHead>Feature</TableHead>
          <TableHead>Blocking</TableHead>
          <TableHead>Confidence</TableHead>
          <TableHead>Summary</TableHead>
          <TableHead>When</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.reviews.map((review) => (
          <TableRow key={review.id}>
            <TableCell>{review.pullRequest.repoFullName}</TableCell>
            <TableCell>#{review.pullRequest.prNumber}</TableCell>
            <TableCell>
              {review.featureRequest ? (
                <Link
                  href={`${DASHBOARD_BASE_PATH}/feature-requests/${review.featureRequest.id}`}
                  className="hover:underline"
                >
                  {review.featureRequest.title}
                </Link>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell>
              {review.blockingCount > 0 ? (
                <Badge variant="outline" className="border-destructive/40 text-destructive">
                  {review.blockingCount}
                </Badge>
              ) : (
                <span className="text-muted-foreground">0</span>
              )}
            </TableCell>
            <TableCell className="text-sm">
              {review.confidenceScore != null ? (
                <span title={confidenceLabel(review.confidenceScore)}>
                  {review.confidenceScore}%
                </span>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell className="max-w-md truncate text-sm">
              {review.summary}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
