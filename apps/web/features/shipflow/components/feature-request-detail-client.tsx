"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  rememberLastFeature,
  isTerminalFeatureStatus,
  clearLastFeature,
} from "@/features/shipflow/lib/last-feature";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CollapsibleCard } from "@/features/shipflow/components/collapsible-card";
import { AiReviewPanel } from "@/features/reviews/components/ai-review-panel";
import { FeatureStatusBadge } from "@/features/shipflow/components/feature-status-badge";
import { PrLinkPanel } from "@/features/shipflow/components/pr-link-panel";
import { FeatureTargetRepoPicker } from "@/features/shipflow/components/feature-target-repo-picker";
import {
  ApprovalHistory,
  ReleaseApprovalPanel,
} from "@/features/shipflow/components/release-approval-panel";
import { PrdDiffPanel } from "@/features/shipflow/components/prd-diff-panel";
import { TaskGenerationProgress } from "@/features/shipflow/components/task-generation-progress";
import { WorkflowStepper } from "@/features/shipflow/components/workflow-stepper";
import { LoadingState } from "@/components/ui/loading-state";
import { ButtonLoadingLabel, LoadingIllustration } from "@/components/ui/loading-illustration";
import {
  aiJobToastId,
  getCreditAffordance,
  getLowCreditsBannerMessage,
} from "@/features/shipflow/lib/credit-hints";
import { BILLING_PATH } from "@/features/dashboard/lib/routes";
import {
  formatAiActionLabel,
  formatFeatureSource,
} from "@/features/dashboard/lib/user-facing-labels";
import { approvePlanAction, approvePrdAction } from "@/lib/actions/shipflow";
import { AI_CREDIT_COSTS, isInFlightFeatureStatus } from "@repo/services/constants";
import { trpc } from "@/trpc/client";

type FeatureRequestDetailClientProps = {
  featureId: string;
};

export function FeatureRequestDetailClient({
  featureId,
}: FeatureRequestDetailClientProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: feature, isLoading, error } = trpc.featureRequest.get.useQuery(
    { id: featureId },
    {
      refetchOnWindowFocus: true,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) return false;
        // Terminal states never change — stop polling.
        if (
          data.status === "shipped" ||
          data.status === "rejected" ||
          data.status === "duplicate"
        ) {
          return false;
        }
        // AI jobs or in-flight PRs update fast.
        if (isInFlightFeatureStatus(data.status)) return 3000;
        const prInFlight = data.pullRequests?.some(
          (pr) => pr.status === "pending" || pr.status === "processing",
        );
        if (prInFlight) return 3000;
        // Otherwise keep the page live (PR links, reviews, status) at a
        // gentler cadence so no manual refresh is ever needed.
        return 5000;
      },
    },
  );

  const workspaceId = feature?.project.workspaceId;
  const inFlight = feature ? isInFlightFeatureStatus(feature.status) : false;

  useEffect(() => {
    if (!feature) return;
    if (isTerminalFeatureStatus(feature.status)) {
      clearLastFeature();
      return;
    }
    rememberLastFeature({
      id: feature.id,
      title: feature.title,
      status: feature.status,
      projectId: feature.projectId,
    });
  }, [feature]);

  const { data: workspace } = trpc.workspace.get.useQuery(
    { workspaceId: workspaceId ?? "" },
    {
      enabled: Boolean(workspaceId),
      refetchInterval: inFlight ? 3000 : false,
    },
  );

  const credits = workspace?.aiCredits ?? 0;
  const billingHref = BILLING_PATH;

  const invalidate = async () => {
    await utils.featureRequest.get.invalidate({ id: featureId });
    if (workspaceId) {
      await utils.workspace.get.invalidate({ workspaceId });
    }
    router.refresh();
  };

  const aiMutationHandlers = (action: string, cost: number) => ({
    onMutate: () => {
      toast.loading(`${action}… (${cost} credit${cost === 1 ? "" : "s"})`, {
        id: aiJobToastId(featureId, action),
      });
    },
    onSuccess: async () => {
      toast.success(
        `${action} started — ${cost} credit${cost === 1 ? "" : "s"} will be used`,
        { id: aiJobToastId(featureId, action) },
      );
      await invalidate();
    },
    onError: (err: { message: string }) => {
      toast.error(err.message, { id: aiJobToastId(featureId, action) });
    },
  });

  const clarifyMutation = trpc.shipflow.triggerClarify.useMutation(
    aiMutationHandlers("AI clarify", AI_CREDIT_COSTS.clarify),
  );
  const prdMutation = trpc.shipflow.triggerPrd.useMutation(
    aiMutationHandlers("Write requirements", AI_CREDIT_COSTS.prd),
  );

  const tasksMutation = trpc.shipflow.triggerTasks.useMutation(
    aiMutationHandlers("Generate tasks", AI_CREDIT_COSTS.tasks),
  );

  const isGeneratingTasks =
    feature?.status === "planning" || tasksMutation.isPending;

  const approvePrdMutation = trpc.shipflow.approvePrd.useMutation({
    onSuccess: async () => {
      toast.success("Requirements approved — you can now generate tasks");
      await invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: planApprovalStatus } = trpc.featureRequest.planApprovalStatus.useQuery(
    { featureRequestId: featureId },
    { enabled: feature?.status === "awaiting_plan_approval" },
  );

  const clarifyReplyMutation = trpc.featureRequest.addClarification.useMutation({
    onSuccess: async (result) => {
      setClarifyReply("");
      if (result.clarifyQueued) {
        toast.success("Reply sent — AI is preparing follow-up questions");
      } else {
        toast.success("Reply saved");
      }
      await invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [clarifyReply, setClarifyReply] = useState("");
  const [isApprovingPlan, startPlanApproval] = useTransition();
  const [isApprovingPrd, startPrdApproval] = useTransition();

  const canGenerateTasks =
    feature?.status === "prd_ready" && feature.prd?.status === "approved";

  const linkedPrKeys = new Set(
    (feature?.pullRequests ?? []).map(
      (pr) => `${pr.repoFullName}#${pr.prNumber}`,
    ),
  );

  const creditAffordance = (cost: number) =>
    getCreditAffordance({ cost, credits, inFlight });

  const lowCreditsBanner = getLowCreditsBannerMessage(
    credits,
    (feature?.pullRequests.length ?? 0) > 0,
  );

  if (isLoading) {
    return (
      <LoadingState
        label="Loading feature"
        description="Fetching requirements, tasks, and workflow status."
        variant="features"
        size="lg"
      />
    );
  }

  if (error || !feature) {
    return (
      <p className="text-sm text-destructive">
        {error?.message ?? "Feature not found"}
      </p>
    );
  }

  const hasTasks = feature.tasks.length > 0;
  const tasksUrl = `/dashboard/tasks?featureId=${featureId}&project=${feature.projectId}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/feature-requests"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Feature requests
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{feature.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <FeatureStatusBadge status={feature.status} />
            <span className="text-xs text-muted-foreground">
              {formatFeatureSource(feature.source)}
            </span>
            {workspace ? (
              <span className="text-xs text-muted-foreground">
                · {workspace.aiCredits} AI credits left
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={inFlight || clarifyMutation.isPending}
            title={creditAffordance(AI_CREDIT_COSTS.clarify).hint}
            onClick={() => {
              const { canAfford, hint } = creditAffordance(AI_CREDIT_COSTS.clarify);
              if (!canAfford) { toast.error(hint); return; }
              clarifyMutation.mutate({ featureRequestId: featureId });
            }}
          >
            {clarifyMutation.isPending ? <ButtonLoadingLabel>Starting…</ButtonLoadingLabel> : formatAiActionLabel("Clarify with AI", AI_CREDIT_COSTS.clarify)}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={inFlight || prdMutation.isPending}
            title={creditAffordance(AI_CREDIT_COSTS.prd).hint}
            onClick={() => {
              const { canAfford, hint } = creditAffordance(AI_CREDIT_COSTS.prd);
              if (!canAfford) { toast.error(hint); return; }
              prdMutation.mutate({ featureRequestId: featureId });
            }}
          >
            {prdMutation.isPending ? <ButtonLoadingLabel>Starting…</ButtonLoadingLabel> : formatAiActionLabel("Write requirements", AI_CREDIT_COSTS.prd)}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isGeneratingTasks || (!canGenerateTasks && feature.status !== "planning")}
            title={canGenerateTasks || feature.status === "planning" ? creditAffordance(AI_CREDIT_COSTS.tasks).hint : "Approve the requirements doc before generating tasks"}
            onClick={() => {
              const { canAfford, hint } = creditAffordance(AI_CREDIT_COSTS.tasks);
              if (!canAfford) { toast.error(hint); return; }
              tasksMutation.mutate({ featureRequestId: featureId });
            }}
          >
            {isGeneratingTasks
              ? <ButtonLoadingLabel>Generating…</ButtonLoadingLabel>
              : feature.status === "planning"
                ? "Retry generate tasks"
                : formatAiActionLabel("Generate tasks", AI_CREDIT_COSTS.tasks)}
          </Button>
          {hasTasks && (
            <Link href={tasksUrl}>
              <Button size="sm" variant="default">
                Go to Task Board →
              </Button>
            </Link>
          )}
        </div>
      </div>

      {lowCreditsBanner.show ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {lowCreditsBanner.message}{" "}
            <Link href={billingHref} className="font-medium underline">
              Open Billing to get more credits
            </Link>
            .
          </CardContent>
        </Card>
      ) : null}

      <WorkflowStepper status={feature.status} taskGenerationActive={isGeneratingTasks} />

      {feature.status === "rejected" && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            This feature was rejected at the human release gate and will not ship.
            Review the approval audit trail below for reviewer notes.
          </CardContent>
        </Card>
      )}

      {feature.status === "duplicate" && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            This request was flagged as a likely duplicate of an existing feature.
            Review similar requests before proceeding.
          </CardContent>
        </Card>
      )}

      {/* ── Request (collapsed once PRD exists) ──────────────────────── */}
      <CollapsibleCard
        title="Request"
        defaultOpen={!feature.prd}
        summary={feature.description.slice(0, 80) + (feature.description.length > 80 ? "…" : "")}
        accent="muted"
      >
        <p className="whitespace-pre-wrap text-sm">{feature.description}</p>
      </CollapsibleCard>

      {/* ── Clarifications ──────────────────────────────────────────── */}
      {feature.clarifications.length > 0 && (
        <CollapsibleCard
          title="Clarifications"
          defaultOpen={feature.status === "draft" && !feature.prd}
          accent="sky"
          statusPill={
            <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-600">
              {feature.clarifications.length} message{feature.clarifications.length !== 1 ? "s" : ""}
            </span>
          }
          summary={undefined}
        >
          <div className="space-y-3">
            {feature.clarifications.map((msg) => (
              <div key={msg.id} className="rounded-lg border p-3 text-sm">
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">{msg.role}</p>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {feature.status !== "duplicate" && (
              <form
                className="space-y-2 pt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!clarifyReply.trim()) return;
                  clarifyReplyMutation.mutate({
                    featureRequestId: featureId,
                    content: clarifyReply.trim(),
                    role: "user",
                  });
                }}
              >
                <Textarea value={clarifyReply} onChange={(e) => setClarifyReply(e.target.value)} placeholder="Reply to clarification questions…" rows={3} />
                <p className="text-xs text-muted-foreground">
                  Your reply automatically queues the next AI clarification round.
                </p>
                <Button type="submit" size="sm" disabled={clarifyReplyMutation.isPending || !clarifyReply.trim()}>
                  {clarifyReplyMutation.isPending ? <ButtonLoadingLabel>Saving…</ButtonLoadingLabel> : "Send reply"}
                </Button>
              </form>
            )}
          </div>
        </CollapsibleCard>
      )}

      {/* ── Approve PRD ─────────────────────────────────────────────── */}
      {feature.status === "awaiting_prd_approval" && feature.prd && (
        <CollapsibleCard title="Approve requirements" defaultOpen accent="amber"
          statusPill={<span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-600">Action needed</span>}>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Review the requirements below. Approve them to unlock task generation.
            </p>
            <Button size="sm" disabled={isApprovingPrd || approvePrdMutation.isPending}
              onClick={() => {
                startPrdApproval(async () => {
                  try {
                    await approvePrdAction(featureId);
                    toast.success("Requirements approved — now generate tasks");
                    await invalidate();
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to approve requirements");
                  }
                });
              }}>
              {isApprovingPrd || approvePrdMutation.isPending ? <ButtonLoadingLabel>Approving…</ButtonLoadingLabel> : "Approve requirements"}
            </Button>
          </div>
        </CollapsibleCard>
      )}

      {/* ── Approve plan ─────────────────────────────────────────────── */}
      {feature.status === "awaiting_plan_approval" && (
        <CollapsibleCard title="Approve engineering plan" defaultOpen accent="amber"
          statusPill={<span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-600">Action needed</span>}>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Team review required before development.{" "}
              {planApprovalStatus
                ? `${planApprovalStatus.approvals.length} of ${planApprovalStatus.required} approval(s) recorded.`
                : <span className="inline-flex items-center gap-2"><LoadingIllustration variant="inline" size="sm" />Loading…</span>}
            </p>
            {planApprovalStatus && planApprovalStatus.approvals.length > 0 && (
              <ul className="space-y-1 text-sm">
                {planApprovalStatus.approvals.map((a) => (
                  <li key={a.id} className="text-muted-foreground">✓ {a.reviewer.name} ({a.reviewer.email})</li>
                ))}
              </ul>
            )}
            <Button size="sm"
              disabled={isApprovingPlan || planApprovalStatus?.currentUserApproved === true}
              onClick={() => {
                startPlanApproval(async () => {
                  try {
                    const result = await approvePlanAction(featureId);
                    toast.success(result.complete ? "Plan fully approved — development can begin" : `Your approval recorded (${result.approvalCount}/${result.required})`);
                    await invalidate();
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to approve plan");
                  }
                });
              }}>
              {planApprovalStatus?.currentUserApproved ? "You approved" : isApprovingPlan ? "Approving…" : "Approve plan"}
            </Button>
          </div>
        </CollapsibleCard>
      )}

      {/* ── PRD ──────────────────────────────────────────────────────── */}
      {feature.prd && (
        <CollapsibleCard
          title="Requirements doc"
          defaultOpen={feature.status === "awaiting_prd_approval" || feature.status === "prd_ready"}
          accent={feature.prd.status === "approved" ? "green" : "amber"}
          statusPill={
            feature.prd.status === "approved"
              ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600">Approved</span>
              : <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-600">Awaiting approval</span>
          }
          summary="Product Requirements Document"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {feature.clarifications.length > 0 ? `Informed by ${feature.clarifications.length} clarification message(s).` : "Generated from request description."}
              </p>
              <Link href={`/dashboard/prd/${featureId}`} className="text-xs text-muted-foreground hover:underline">
                Open in requirements editor →
              </Link>
            </div>
            <PrdDiffPanel aiDraftMarkdown={feature.prd.aiDraftMarkdown} currentMarkdown={feature.prd.rawMarkdown} />
            <pre className="whitespace-pre-wrap text-sm">{feature.prd.rawMarkdown}</pre>
          </div>
        </CollapsibleCard>
      )}

      {/* ── Engineering tasks ────────────────────────────────────────── */}
      {hasTasks && (
        <CollapsibleCard
          title="Engineering tasks"
          defaultOpen
          accent="violet"
          statusPill={
            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-600">
              {feature.tasks.filter((t) => t.status === "done").length}/{feature.tasks.length} done
            </span>
          }
          summary={undefined}
        >
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              These tasks were generated from the approved requirements. Use the Task Board to move them forward, draft code with AI, or manage them.
            </p>
            <div className="space-y-1.5">
              {feature.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <span className={task.status === "done" ? "line-through text-muted-foreground" : ""}>{task.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    task.status === "done" ? "bg-emerald-500/10 text-emerald-600" :
                    task.status === "in_progress" ? "bg-violet-500/10 text-violet-600" :
                    "bg-muted text-muted-foreground"
                  }`}>{task.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <Link href={tasksUrl}>
                <Button size="sm">
                  Open Task Board → work on these tasks
                </Button>
              </Link>
            </div>
          </div>
        </CollapsibleCard>
      )}

      {/* ── Task generation in progress ──────────────────────────────── */}
      {feature.status === "planning" && !isGeneratingTasks && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-amber-500" />
            <p className="text-sm font-medium text-amber-700">Task generation didn&apos;t finish</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Something interrupted the last attempt. Click <strong>Retry generate tasks</strong> below — it usually takes about 15 seconds.
          </p>
          <Button size="sm" variant="outline"
            disabled={isGeneratingTasks}
            onClick={() => tasksMutation.mutate({ featureRequestId: featureId })}>
            {isGeneratingTasks ? <ButtonLoadingLabel>Generating…</ButtonLoadingLabel> : "Retry generate tasks"}
          </Button>
        </div>
      )}

      {isGeneratingTasks ? (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/[0.05] p-4">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 animate-pulse rounded-full bg-violet-500" />
            <p className="text-sm font-medium text-violet-700">Turning requirements into engineering tasks…</p>
          </div>
          <TaskGenerationProgress className="mt-3" />
        </div>
      ) : null}

      {/* ── Next step hints ──────────────────────────────────────────── */}
      {!hasTasks && feature.status !== "planning" && feature.prd?.status === "approved" && (
        <div className="rounded-xl border border-dashed border-violet-500/40 bg-violet-500/[0.03] p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Next: Generate engineering tasks</p>
          <p className="mt-1 text-xs">Requirements are approved. Click <strong>{formatAiActionLabel("Generate tasks", AI_CREDIT_COSTS.tasks)}</strong> above to break them into actionable tasks on the Task Board.</p>
        </div>
      )}
      {!feature.prd && feature.status !== "prd_generating" && (
        <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Next: Write requirements</p>
          <p className="mt-1 text-xs">Click <strong>Write requirements</strong> above to turn this request{feature.clarifications.length > 0 ? " and the clarifications" : ""} into a structured product plan.</p>
        </div>
      )}

      {/* ── Code generation target ──────────────────────────────────── */}
      {(feature.project.repositories?.length ?? 0) > 0 && (
        <CollapsibleCard
          title="Code generation target"
          defaultOpen={!feature.targetRepository}
          accent={feature.targetRepository ? "green" : "amber"}
          statusPill={
            feature.targetRepository
              ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600">{feature.targetRepository.repoFullName}</span>
              : <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-600">Not set</span>
          }
          summary={feature.targetRepository ? undefined : "Pick a repo for AI code generation"}
        >
          <FeatureTargetRepoPicker
            featureRequestId={featureId}
            connectedRepos={feature.project.repositories ?? []}
            targetRepository={feature.targetRepository ?? null}
            onChanged={invalidate}
          />
        </CollapsibleCard>
      )}

      <PrLinkPanel
        featureRequestId={featureId}
        linkedPullRequests={feature.pullRequests.map((pr) => ({
          id: pr.id,
          repoFullName: pr.repoFullName,
          prNumber: pr.prNumber,
          title: pr.title,
          status: pr.status,
          updatedAt: String(pr.updatedAt),
        }))}
        onUpdated={invalidate}
      />

      <AiReviewPanel
        reviews={feature.aiReviews
          .filter((review) =>
            review.pullRequest
              ? linkedPrKeys.has(
                  `${review.pullRequest.repoFullName}#${review.pullRequest.prNumber}`,
                )
              : false,
          )
          .map((review) => ({
            ...review,
            createdAt: new Date(review.createdAt),
          }))}
      />

      <ReleaseApprovalPanel
        featureRequestId={featureId}
        status={feature.status}
        onUpdated={invalidate}
      />

      <ApprovalHistory
        approvals={feature.approvals.map((approval) => ({
          ...approval,
          createdAt: new Date(approval.createdAt),
        }))}
      />
    </div>
  );
}
