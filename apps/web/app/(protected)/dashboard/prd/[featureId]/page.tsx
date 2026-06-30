import Link from "next/link";
import { notFound } from "next/navigation";

import { PrdEditorForm } from "@/features/shipflow/components/prd-editor-form";
import { FeatureStatusBadge } from "@/features/shipflow/components/feature-status-badge";
import { ensureWorkspaceAction } from "@/lib/actions/shipflow";
import { prisma } from "@/lib/db";

type PrdDetailPageProps = {
  params: Promise<{ featureId: string }>;
};

export default async function PrdDetailPage({ params }: PrdDetailPageProps) {
  const { featureId } = await params;
  const workspace = await ensureWorkspaceAction();

  const feature = await prisma.featureRequest.findFirst({
    where: {
      id: featureId,
      project: { workspaceId: workspace.id },
    },
    include: { prd: true },
  });

  if (!feature?.prd) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/prd"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Requirements
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{feature.title}</h1>
          <FeatureStatusBadge status={feature.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit the requirements document. Changes sync to the feature page.
        </p>
      </div>

      <PrdEditorForm
        featureRequestId={feature.id}
        initialMarkdown={feature.prd.rawMarkdown}
      />
    </div>
  );
}
