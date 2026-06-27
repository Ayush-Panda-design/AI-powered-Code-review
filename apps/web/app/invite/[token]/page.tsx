import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setActiveWorkspaceAction } from "@/lib/actions/shipflow";
import { requireSession } from "@/lib/auth-session";
import { acceptWorkspaceInvite } from "@repo/services";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await requireSession(`/invite/${token}`);

  let error: string | null = null;
  let workspaceId: string | null = null;

  try {
    const result = await acceptWorkspaceInvite(token, session.user.id);
    workspaceId = result.workspaceId;
    await setActiveWorkspaceAction(result.workspaceId);
  } catch (inviteError) {
    error =
      inviteError instanceof Error
        ? inviteError.message
        : "Failed to accept invite";
  }

  if (workspaceId) {
    redirect("/dashboard/workspaces");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Workspace invite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground">
            Make sure you are signed in with the email address that received the
            invite.
          </p>
          <Button render={<Link href="/dashboard" />}>Go to dashboard</Button>
        </CardContent>
      </Card>
    </div>
  );
}
