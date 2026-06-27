"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/trpc/client";

type PrLinkPanelProps = {
  featureRequestId: string;
  linkedPullRequests: Array<{
    id: string;
    repoFullName: string;
    prNumber: number;
    title: string;
    status: string;
  }>;
  onUpdated: () => Promise<void>;
};

export function PrLinkPanel({
  featureRequestId,
  linkedPullRequests,
  onUpdated,
}: PrLinkPanelProps) {
  const [selectedPrId, setSelectedPrId] = useState<string>("");
  const utils = trpc.useUtils();

  const { data: linkable = [], isLoading } =
    trpc.featureRequest.listLinkablePullRequests.useQuery({
      featureRequestId,
    });

  const linkMutation = trpc.featureRequest.linkPullRequest.useMutation({
    onSuccess: async () => {
      toast.success("Pull request linked");
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
      await onUpdated();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pull requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {linkedPullRequests.length > 0 ? (
          <div className="space-y-2">
            {linkedPullRequests.map((pr) => (
              <div
                key={pr.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2 text-sm"
              >
                <span>
                  {pr.repoFullName} #{pr.prNumber} — {pr.title}
                </span>
                <div className="flex items-center gap-2">
                  <span className="capitalize text-xs text-muted-foreground">
                    {pr.status}
                  </span>
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
            Auto-link via branch <code>feature/&lt;id&gt;</code> or title{" "}
            <code>[shipflow:&lt;id&gt;]</code>, or pick from connected repos:
          </p>
          <div className="flex flex-wrap gap-2">
            <Select
              value={selectedPrId}
              onValueChange={(value) => {
                if (value) setSelectedPrId(value);
              }}
              disabled={isLoading || linkable.length === 0}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue
                  placeholder={
                    isLoading
                      ? "Loading PRs…"
                      : linkable.length === 0
                        ? "No linkable PRs in connected repos"
                        : "Select a pull request"
                  }
                />
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
              {linkMutation.isPending ? "Linking…" : "Link PR"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
