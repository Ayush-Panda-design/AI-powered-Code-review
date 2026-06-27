"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  connectRepositoryAction,
  disconnectRepositoryAction,
} from "@/lib/actions/shipflow";
import { ReposList } from "@/features/dashboard/components/repos-list";

type ConnectedRepo = {
  repoFullName: string;
  projectId: string;
};

type ReposConnectPanelProps = {
  projectId: string;
  installationId: number;
  connectedRepos: ConnectedRepo[];
  repoLimit: number;
};

export function ReposConnectPanel({
  projectId,
  installationId,
  connectedRepos,
  repoLimit,
}: ReposConnectPanelProps) {
  const [isPending, startTransition] = useTransition();
  const connectedSet = new Set(connectedRepos.map((repo) => repo.repoFullName));

  const toggleRepo = (repoFullName: string, defaultBranch: string, connected: boolean) => {
    startTransition(async () => {
      try {
        if (connected) {
          await disconnectRepositoryAction(projectId, repoFullName);
          toast.success(`Disconnected ${repoFullName}`);
        } else {
          await connectRepositoryAction(
            projectId,
            repoFullName,
            installationId,
            defaultBranch,
          );
          toast.success(`Connected ${repoFullName}`);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Repository action failed",
        );
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">
          {connectedRepos.length} / {repoLimit} connected
        </Badge>
        <span>Connect repos to your project for ShipFlow tracking and limits.</span>
      </div>
      <ReposList
        renderActions={(repo) => {
          const connected = connectedSet.has(repo.fullName);
          return (
            <Button
              type="button"
              size="sm"
              variant={connected ? "outline" : "default"}
              disabled={isPending || (!connected && connectedRepos.length >= repoLimit)}
              onClick={() =>
                toggleRepo(repo.fullName, repo.defaultBranch, connected)
              }
            >
              {connected ? "Disconnect" : "Connect"}
            </Button>
          );
        }}
      />
    </div>
  );
}
