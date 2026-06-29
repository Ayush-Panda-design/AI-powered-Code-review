import { IntakePageClient } from "@/features/dashboard/components/intake-page-client";
import { ensureWorkspaceAction } from "@/lib/actions/shipflow";
import { getActiveProjectForWorkspace } from "@/lib/active-project";
import { requireSession } from "@/lib/auth-session";
import { listProjects } from "@repo/services";

export default async function IntakePage() {
  await requireSession("/dashboard/intake");
  const workspace = await ensureWorkspaceAction();
  const [projects, activeProject] = await Promise.all([
    listProjects(workspace.id),
    getActiveProjectForWorkspace(workspace.id),
  ]);

  const project = activeProject ?? projects[0];
  if (!project) {
    return (
      <p className="text-sm text-muted-foreground">
        Create a project first, then return to customer intake.
      </p>
    );
  }

  return (
    <IntakePageClient projectId={project.id} workspaceId={workspace.id} />
  );
}
