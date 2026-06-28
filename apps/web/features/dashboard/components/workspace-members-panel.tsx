"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ButtonLoadingLabel } from "@/components/ui/loading-illustration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";

type WorkspaceMembersPanelProps = {
  workspaceId: string;
};

export function WorkspaceMembersPanel({
  workspaceId,
}: WorkspaceMembersPanelProps) {
  const [email, setEmail] = useState("");
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: members = [] } = trpc.workspace.listMembers.useQuery({
    workspaceId,
  });
  const { data: invites = [] } = trpc.workspace.listInvites.useQuery({
    workspaceId,
  });

  const inviteMutation = trpc.workspace.inviteMember.useMutation({
    onSuccess: async (result) => {
      if (result.type === "added") {
        toast.success(`${result.email} added to workspace`);
        setLastInviteUrl(null);
      } else {
        toast.success(`Invite created for ${result.email}`);
        setLastInviteUrl(result.inviteUrl);
      }
      setEmail("");
      await Promise.all([
        utils.workspace.listMembers.invalidate({ workspaceId }),
        utils.workspace.listInvites.invalidate({ workspaceId }),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{member.user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {member.user.email}
                </p>
              </div>
              <span className="text-xs capitalize text-muted-foreground">
                {member.role}
              </span>
            </div>
          ))}
        </div>

        {invites.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Pending invites</p>
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="rounded border border-dashed px-3 py-2 text-sm text-muted-foreground"
              >
                {invite.email} · expires{" "}
                {new Date(invite.expiresAt).toLocaleDateString()}
              </div>
            ))}
          </div>
        )}

        <form
          className="flex flex-wrap gap-2 border-t pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!email.trim()) return;
            inviteMutation.mutate({
              workspaceId,
              email: email.trim(),
              role: "member",
            });
          }}
        >
          <Input
            type="email"
            placeholder="teammate@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="max-w-sm"
          />
          <Button type="submit" disabled={inviteMutation.isPending}>
            {inviteMutation.isPending ? (
              <ButtonLoadingLabel>Inviting…</ButtonLoadingLabel>
            ) : (
              "Invite member"
            )}
          </Button>
        </form>

        {lastInviteUrl ? (
          <p className="text-xs text-muted-foreground">
            Share invite link:{" "}
            <code className="break-all rounded bg-muted px-1 py-0.5">
              {lastInviteUrl}
            </code>
          </p>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Engineering plan approval requires {members.length >= 2 ? 2 : 1}{" "}
          team member approval(s) before development starts.
        </p>
      </CardContent>
    </Card>
  );
}
