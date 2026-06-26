import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureStatusBadge } from "@/features/shipflow/components/feature-status-badge";
import { ensureWorkspaceAction } from "@/lib/actions/shipflow";
import { prisma } from "@/lib/db";
import { createFeatureRequest } from "@repo/services";

async function getOrCreateDefaultProject(workspaceId: string) {
  const existing = await prisma.project.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });

  if (existing) return existing;

  return prisma.project.create({
    data: {
      workspaceId,
      name: "Default Project",
      description: "Main product delivery pipeline",
    },
  });
}

export default async function FeatureRequestsPage() {
  const workspace = await ensureWorkspaceAction();
  const project = await getOrCreateDefaultProject(workspace.id);
  const features = await prisma.featureRequest.findMany({
    where: { projectId: project.id },
    include: { prd: { select: { id: true } }, _count: { select: { tasks: true } } },
    orderBy: { updatedAt: "desc" },
  });

  async function createFeature(formData: FormData) {
    "use server";
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (!title || !description) return;

    const ws = await ensureWorkspaceAction();
    const proj = await getOrCreateDefaultProject(ws.id);
    const feature = await createFeatureRequest({
      projectId: proj.id,
      title,
      description,
      source: "manual",
    });

    const { redirect } = await import("next/navigation");
    redirect(`/dashboard/feature-requests/${feature.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Feature Requests</h1>
          <p className="text-sm text-muted-foreground">
            Capture product ideas and run the ShipFlow delivery loop
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New feature request</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFeature} className="grid gap-3">
            <input
              name="title"
              placeholder="Feature title"
              className="rounded-md border bg-background px-3 py-2 text-sm"
              required
            />
            <textarea
              name="description"
              placeholder="Describe the customer problem, context, and desired outcome..."
              className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm"
              required
            />
            <Button type="submit" className="w-fit">
              <Plus className="mr-2 size-4" /> Create request
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {features.length === 0 ? (
          <p className="text-sm text-muted-foreground">No feature requests yet.</p>
        ) : (
          features.map((feature) => (
            <Link key={feature.id} href={`/dashboard/feature-requests/${feature.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-medium">{feature.title}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <FeatureStatusBadge status={feature.status} />
                    <span>{feature._count.tasks} tasks</span>
                    {feature.prd && <span>PRD</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
