"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setActiveWorkspaceAction } from "@/lib/actions/shipflow";

type WorkspaceOption = {
  id: string;
  name: string;
};

type WorkspaceSwitcherProps = {
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string;
};

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (workspaces.length <= 1) {
    return (
      <p className="truncate px-2 text-xs text-muted-foreground">
        {workspaces[0]?.name ?? "Workspace"}
      </p>
    );
  }

  return (
    <Select
      value={activeWorkspaceId}
      disabled={isPending}
      onValueChange={(workspaceId) => {
        if (!workspaceId) return;
        startTransition(async () => {
          try {
            await setActiveWorkspaceAction(workspaceId);
            router.refresh();
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to switch workspace",
            );
          }
        });
      }}
    >
      <SelectTrigger className="h-8 w-full border-0 bg-transparent shadow-none">
        <SelectValue placeholder="Workspace" />
      </SelectTrigger>
      <SelectContent>
        {workspaces.map((workspace) => (
          <SelectItem key={workspace.id} value={workspace.id}>
            {workspace.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
