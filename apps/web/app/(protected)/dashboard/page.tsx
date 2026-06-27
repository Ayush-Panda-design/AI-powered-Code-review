import { OverviewContent } from "@/features/dashboard/components/overview-content";
import { getOverviewData } from "@/features/dashboard/server/overview-data";
import { ensureWorkspaceAction } from "@/lib/actions/shipflow";
import { requireSession } from "@/lib/auth-session";

export default async function DashboardOverviewPage() {
  const session = await requireSession("/dashboard");
  const workspace = await ensureWorkspaceAction();
  const data = await getOverviewData(session.user.id, workspace.id);
  return <OverviewContent data={data} />;
}
