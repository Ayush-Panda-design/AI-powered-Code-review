"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityFeed } from "@/features/dashboard/components/activity-feed";
import { SectionGuideCard } from "@/features/dashboard/components/section-guide-card";

type ActivityPageClientProps = {
  workspaceId: string;
};

export function ActivityPageClient({ workspaceId }: ActivityPageClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Activity feed</h2>
        <p className="text-sm text-muted-foreground">
          Org-wide audit trail — reviews, approvals, and stale PR nudges.
        </p>
      </div>

      <SectionGuideCard section="activity" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent events</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed workspaceId={workspaceId} />
        </CardContent>
      </Card>
    </div>
  );
}
