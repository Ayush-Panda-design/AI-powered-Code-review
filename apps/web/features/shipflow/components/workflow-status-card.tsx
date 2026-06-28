"use client";

import { LoadingIllustration } from "@/components/ui/loading-illustration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorkflowProgress } from "@/features/shipflow/lib/workflow-status";
import { cn } from "@/lib/utils";

export function WorkflowStatusCard({ status }: { status: string }) {
  const progress = getWorkflowProgress(status);

  if (!progress) {
    return null;
  }

  const percent =
    progress.inFlight && progress.step > 0
      ? Math.round((progress.step / progress.totalSteps) * 100)
      : 0;

  return (
    <Card
      className={cn(
        "border-dashed",
        progress.inFlight && "border-status-warning/40",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {progress.inFlight ? (
            <LoadingIllustration variant="inline" size="sm" />
          ) : null}
          {progress.inFlight ? "Workflow running" : "Delivery loop"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {progress.inFlight ? (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">
                Step {progress.step} of {progress.totalSteps}: {progress.stepLabel}
              </span>
              <span>{percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-status-success via-status-warning to-status-progress transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </>
        ) : null}
        <p>{progress.description}</p>
      </CardContent>
    </Card>
  );
}
