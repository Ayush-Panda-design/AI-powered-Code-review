import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { FeatureStatusBadge } from "@/features/shipflow/components/feature-status-badge";
import {
  ApprovalHistory,
  ReleaseApprovalPanel,
} from "@/features/shipflow/components/release-approval-panel";
import { ensureWorkspaceAction } from "@/lib/actions/shipflow";
import { prisma } from "@/lib/db";

export default async function ApprovalsPage() {
  const workspace = await ensureWorkspaceAction();

  const features = await prisma.featureRequest.findMany({
    where: {
      project: { workspaceId: workspace.id },
      status: {
        in: ["awaiting_approval", "fix_needed", "release_checking"],
      },
    },
    include: {
      approvals: {
        orderBy: { createdAt: "desc" },
        include: { reviewer: { select: { name: true, email: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Release Approval</h1>
        <p className="text-sm text-muted-foreground">
          Human gate for features ready to ship
        </p>
      </div>

      {features.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No features awaiting release approval.
        </p>
      ) : (
        features.map((feature) => (
          <Card key={feature.id}>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/dashboard/feature-requests/${feature.id}`}
                    className="font-medium hover:underline"
                  >
                    {feature.title}
                  </Link>
                  <div className="mt-1">
                    <FeatureStatusBadge status={feature.status} />
                  </div>
                </div>
              </div>
              <ReleaseApprovalPanel
                featureRequestId={feature.id}
                status={feature.status}
              />
              <ApprovalHistory
                approvals={feature.approvals.map((approval) => ({
                  ...approval,
                  createdAt: new Date(approval.createdAt),
                }))}
              />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
