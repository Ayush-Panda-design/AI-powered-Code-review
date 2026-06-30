import { FeatureRequestsPageClient } from "@/features/dashboard/components/feature-requests-page-client";
import { ensureWorkspaceAction } from "@/lib/actions/shipflow";
import { getActiveProjectForWorkspace } from "@/lib/active-project";
import { listProjects } from "@repo/services";

export const dynamic = "force-dynamic";

export default async function ShippedFeaturesPage() {
  const workspace = await ensureWorkspaceAction();
  const [projects, activeProject] = await Promise.all([
    listProjects(workspace.id),
    getActiveProjectForWorkspace(workspace.id),
  ]);

  return (
    <FeatureRequestsPageClient
      projectId={activeProject.id}
      projects={projects.map((project) => ({
        id: project.id,
        name: project.name,
      }))}
      initialStatusFilter="shipped"
    />
  );
}
