import { ActivityPageClient } from "@/features/dashboard/components/activity-page-client";
import { ensureWorkspaceAction } from "@/lib/actions/shipflow";

export default async function ActivityPage() {
  const workspace = await ensureWorkspaceAction();

  return <ActivityPageClient workspaceId={workspace.id} />;
}
