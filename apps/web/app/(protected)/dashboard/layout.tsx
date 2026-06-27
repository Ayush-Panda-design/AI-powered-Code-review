import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { ensureWorkspaceAction } from "@/lib/actions/shipflow";
import { requireSession } from "@/lib/auth-session";
import { listWorkspacesForUser } from "@repo/services";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession("/dashboard");
  const activeWorkspace = await ensureWorkspaceAction();
  const workspaces = await listWorkspacesForUser(session.user.id);

  return (
    <DashboardShell
      user={session.user}
      workspaces={workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
      }))}
      activeWorkspaceId={activeWorkspace.id}
    >
      {children}
    </DashboardShell>
  );
}
