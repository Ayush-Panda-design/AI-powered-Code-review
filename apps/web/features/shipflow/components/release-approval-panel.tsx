"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  approveReleaseAction,
  rejectReleaseAction,
  requestReReviewAction,
} from "@/lib/actions/shipflow";

type ApprovalRecord = {
  id: string;
  decision: string;
  notes: string | null;
  createdAt: Date;
  reviewer: { name: string; email: string };
};

function ApproveReleaseForm({
  featureRequestId,
  isPending,
  onSubmit,
  description,
  notesPlaceholder,
}: {
  featureRequestId: string;
  isPending: boolean;
  onSubmit: (action: () => Promise<void>) => void;
  description: string;
  notesPlaceholder: string;
}) {
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSubmit(() =>
          approveReleaseAction(
            featureRequestId,
            formData.get("approveNotes")?.toString(),
          ),
        );
      }}
    >
      <p className="text-sm text-muted-foreground">{description}</p>
      <Textarea
        name="approveNotes"
        placeholder={notesPlaceholder}
        rows={3}
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Approving…" : "Approve & ship"}
      </Button>
    </form>
  );
}

function RejectReleaseForm({
  featureRequestId,
  isPending,
  onSubmit,
}: {
  featureRequestId: string;
  isPending: boolean;
  onSubmit: (action: () => Promise<void>) => void;
}) {
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const notes = formData.get("rejectNotes")?.toString();
        if (!notes?.trim()) {
          toast.error("Please describe what must be fixed.");
          return;
        }
        onSubmit(() => rejectReleaseAction(featureRequestId, notes));
      }}
    >
      <p className="text-sm text-muted-foreground">
        Reject to send the feature back for fixes (status → fix needed).
      </p>
      <Textarea
        name="rejectNotes"
        placeholder="What must be fixed before release?"
        rows={3}
        required
      />
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        disabled={isPending}
      >
        {isPending ? "Rejecting…" : "Reject release"}
      </Button>
    </form>
  );
}

export function ReleaseApprovalPanel({
  featureRequestId,
  status,
  onUpdated,
}: {
  featureRequestId: string;
  status: string;
  onUpdated?: () => void | Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  const runAction = (action: () => Promise<void>) => {
    startTransition(async () => {
      try {
        await action();
        await onUpdated?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Action failed",
        );
      }
    });
  };

  if (status === "fix_needed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Release decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              AI review flagged blocking issues. Push fixes to the linked PR and
              GitHub will auto-queue a re-review, or trigger one manually:
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() =>
                runAction(() => requestReReviewAction(featureRequestId))
              }
            >
              {isPending ? "Requesting…" : "Request re-review now"}
            </Button>
          </div>

          <Separator />

          <ApproveReleaseForm
            featureRequestId={featureRequestId}
            isPending={isPending}
            onSubmit={runAction}
            description="Review the AI findings above. If they are false positives or acceptable risks, you can override and ship."
            notesPlaceholder="Optional: why you're overriding AI blocking findings"
          />
        </CardContent>
      </Card>
    );
  }

  if (status !== "awaiting_approval") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Human release gate</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <ApproveReleaseForm
          featureRequestId={featureRequestId}
          isPending={isPending}
          onSubmit={runAction}
          description="Approve when the feature meets the PRD and passes AI review."
          notesPlaceholder="Optional approval notes"
        />

        <RejectReleaseForm
          featureRequestId={featureRequestId}
          isPending={isPending}
          onSubmit={runAction}
        />
      </CardContent>
    </Card>
  );
}

export function ApprovalHistory({ approvals }: { approvals: ApprovalRecord[] }) {
  if (approvals.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Approval history</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {approvals.map((approval) => (
          <div key={approval.id} className="rounded-lg border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium capitalize">{approval.decision}</span>
              <span className="text-xs text-muted-foreground">
                {approval.reviewer.name} ·{" "}
                {approval.createdAt.toLocaleString()}
              </span>
            </div>
            {approval.notes && (
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {approval.notes}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
