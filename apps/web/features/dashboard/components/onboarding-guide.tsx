import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  FolderGit2,
  GitBranch,
  GitPullRequest,
  Lightbulb,
  Lock,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DASHBOARD_BASE_PATH } from "@/features/dashboard/lib/routes";
import type { OnboardingState } from "@/features/dashboard/server/onboarding-state";
import { cn } from "@/lib/utils";

const planningLinks = [
  { label: "Feature Requests", href: `${DASHBOARD_BASE_PATH}/feature-requests` },
  { label: "Customer Intake", href: `${DASHBOARD_BASE_PATH}/intake` },
  { label: "PRD Editor", href: `${DASHBOARD_BASE_PATH}/prd` },
  { label: "Task Board", href: `${DASHBOARD_BASE_PATH}/tasks` },
  { label: "Projects", href: `${DASHBOARD_BASE_PATH}/projects` },
] as const;

const githubOnlyLinks = [
  { label: "Pull Requests", href: `${DASHBOARD_BASE_PATH}/pull-requests` },
  { label: "Review History", href: `${DASHBOARD_BASE_PATH}/review-history` },
  { label: "Repositories", href: `${DASHBOARD_BASE_PATH}/repositories` },
] as const;

type OnboardingGuideProps = {
  state: OnboardingState;
  variant?: "full" | "compact";
};

function StepIcon({ done, active }: { done: boolean; active: boolean }) {
  if (done) {
    return <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />;
  }
  if (active) {
    return <Circle className="size-5 shrink-0 text-primary" strokeWidth={2.5} />;
  }
  return <Lock className="size-4 shrink-0 text-muted-foreground/60" />;
}

function SetupStep({
  step,
  title,
  description,
  done,
  active,
  locked,
  action,
}: {
  step: number;
  title: string;
  description: string;
  done: boolean;
  active: boolean;
  locked: boolean;
  action?: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex gap-3 rounded-lg border p-4",
        active && "border-primary/40 bg-primary/5",
        done && "border-emerald-500/30 bg-emerald-500/5",
        locked && "opacity-60",
      )}
    >
      <StepIcon done={done} active={active} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step {step}
          {done ? " · Done" : active ? " · Next" : locked ? " · Locked" : ""}
        </p>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        {action && active ? <div className="pt-2">{action}</div> : null}
      </div>
    </li>
  );
}

export function OnboardingGuide({ state, variant = "full" }: OnboardingGuideProps) {
  if (state.isComplete) {
    return null;
  }

  const step1Done = state.signedInWithGitHub;
  const step2Done = state.githubAppConnected;
  const step3Done = state.connectedRepos > 0;

  const step1Active = state.currentStep === 1;
  const step2Active = state.currentStep === 2;
  const step3Active = state.currentStep === 3;

  if (variant === "compact") {
    const messages: Record<typeof state.currentStep, { title: string; href: string; label: string }> =
      {
        1: {
          title: "Sign in with GitHub to unlock repositories and PR reviews",
          href: "/sign-in",
          label: "Sign in with GitHub",
        },
        2: {
          title: "Install or link the GitHub App on your account",
          href: `${DASHBOARD_BASE_PATH}/github-app`,
          label: "GitHub App setup",
        },
        3: {
          title: "Connect at least one repository to your project",
          href: `${DASHBOARD_BASE_PATH}/repositories`,
          label: "Connect repositories",
        },
        complete: { title: "", href: "", label: "" },
      };

    const next = messages[state.currentStep];
    const tone =
      state.variant === "email"
        ? "border-amber-500/30 bg-amber-500/10"
        : "border-sky-500/30 bg-sky-500/10";

    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-lg border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
          tone,
        )}
      >
        <div className="space-y-1">
          <p className="font-medium">
            {state.variant === "email"
              ? "Email account — planning tools only"
              : "GitHub account — finish setup for PR reviews"}
          </p>
          <p className="text-muted-foreground">
            Step {state.currentStep} of 3: {next.title}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`${DASHBOARD_BASE_PATH}#get-started`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Full guide
          </Link>
          <Link href={next.href} className={buttonVariants({ size: "sm" })}>
            <GitBranch className="size-4" />
            {next.label}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Card id="get-started" className="border-dashed">
      <CardHeader>
        <CardTitle>Get started</CardTitle>
        <CardDescription>
          {state.variant === "email" ? (
            <>
              You signed in with <strong>email</strong>. ShipFlow planning tools work
              right away. To sync GitHub pull requests and run AI reviews, complete the
              three steps on the right.
            </>
          ) : (
            <>
              You signed in with <strong>GitHub</strong>
              {state.githubAccountLogin ? ` (@${state.githubAccountLogin})` : ""}.
              Finish the steps below so ShipFlow can read your repos and review PRs.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-4 text-amber-600" />
              <h3 className="font-medium">Works with any sign-in</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              No GitHub connection required. Use these to plan and track work inside
              ShipFlow.
            </p>
            <ul className="space-y-2">
              {planningLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center gap-2">
              <GitPullRequest className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Needs GitHub setup (steps on the right)
              </h3>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {githubOnlyLinks.map((link) => (
                <li key={link.href}>{link.label}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <FolderGit2 className="size-4 text-sky-600" />
              <h3 className="font-medium">
                {state.variant === "email"
                  ? "GitHub setup (required for PR reviews)"
                  : "Your GitHub setup checklist"}
              </h3>
            </div>
            <ol className="space-y-3">
              <SetupStep
                step={1}
                title="Sign in with GitHub"
                description="Use the same GitHub account you want repos and PRs from. Email-only login cannot connect the GitHub App."
                done={step1Done}
                active={step1Active}
                locked={!step1Active && !step1Done}
                action={
                  <Link href="/sign-in" className={buttonVariants({ size: "sm" })}>
                    Sign in with GitHub
                  </Link>
                }
              />
              <SetupStep
                step={2}
                title="Install or link the GitHub App"
                description="Grants ShipFlow permission to read PRs on your GitHub account. Sign-in alone is not enough."
                done={step2Done}
                active={step2Active}
                locked={!step2Done && !step2Active}
                action={
                  <Link
                    href={`${DASHBOARD_BASE_PATH}/github-app`}
                    className={buttonVariants({ size: "sm" })}
                  >
                    Open GitHub App setup
                  </Link>
                }
              />
              <SetupStep
                step={3}
                title="Connect repositories"
                description="Pick which repos belong to your project. PR sync and AI reviews only run on connected repos."
                done={step3Done}
                active={step3Active}
                locked={!step3Done && !step3Active}
                action={
                  <Link
                    href={`${DASHBOARD_BASE_PATH}/repositories`}
                    className={buttonVariants({ size: "sm" })}
                  >
                    Connect repositories
                  </Link>
                }
              />
            </ol>
            {step3Done ? (
              <p className="text-sm text-muted-foreground">
                Next: open{" "}
                <Link
                  href={`${DASHBOARD_BASE_PATH}/pull-requests`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Pull Requests
                </Link>{" "}
                and click <strong>Sync from GitHub</strong> to import PRs.
              </p>
            ) : null}
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
