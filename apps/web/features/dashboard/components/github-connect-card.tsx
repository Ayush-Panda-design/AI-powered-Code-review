import { AppWindow, Plug, Unplug } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { githubAppStatusStyles } from "@/features/dashboard/lib/status-styles";
import { getSafeGitHubErrorMessage } from "@/features/github/server/github-user-errors";
import type { GitHubLinkDiagnostics } from "@/features/github/server/installation";
import {
  getGitHubAppConfigError,
  getGitHubInstallUrl,
} from "@/features/github/utils/github-app";
import { disconnectGitHubApp, linkGitHubInstallation } from "@/lib/actions/github";
import {
  formatGitHubAccountType,
  isDevelopmentEnvironment,
} from "@/features/dashboard/lib/user-facing-labels";
import { cn } from "@/lib/utils";

type GitHubConnectCardProps = {
  userId: string;
  installation: {
    accountLogin: string;
    accountType: string;
  } | null;
  signedInWithGitHub: boolean;
  error?: string | null;
  diagnostics?: GitHubLinkDiagnostics | null;
};

function ConnectOption({
  title,
  when,
  steps,
  action,
  highlighted,
}: {
  title: string;
  when: string;
  steps: string[];
  action: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 text-left",
        highlighted ? "border-primary/40 bg-primary/5" : "border-border/60",
      )}
    >
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{when}</p>
      </div>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="pt-1">{action}</div>
    </div>
  );
}

export function GitHubConnectCard({
  userId,
  installation,
  signedInWithGitHub,
  error,
  diagnostics,
}: GitHubConnectCardProps) {
  const isConnected = Boolean(installation);
  const configError = getGitHubAppConfigError();
  const installUrl = getGitHubInstallUrl(userId);
  const canInstall = Boolean(installUrl);
  const status = isConnected ? "connected" : canInstall ? "disconnected" : "error";
  const statusStyle = githubAppStatusStyles[status];
  const safeError = getSafeGitHubErrorMessage(error, diagnostics ?? null);
  const userLogin = diagnostics?.identityLogins[0];
  const needsInstallFirst =
    error === "no_installation" ||
    error === "link_failed" ||
    (diagnostics != null && !diagnostics.yourInstallFound);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <AppWindow className="size-5" />
              GitHub App
            </CardTitle>
            <CardDescription>
              {userLogin ? (
                <>
                  Connect <strong>your</strong> GitHub account (
                  <strong>@{userLogin}</strong>) — not anyone else&apos;s. Each
                  ShipFlow user installs the app on their own GitHub.
                </>
              ) : (
                <>
                  Sign in with GitHub first, then install the app on your
                  account only.
                </>
              )}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0 font-medium", statusStyle.badgeClassName)}
          >
            {statusStyle.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {safeError ? (
          <div
            className={cn(
              "space-y-2 rounded-lg border px-4 py-3 text-sm",
              needsInstallFirst
                ? "border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            <p className="font-medium">
              {needsInstallFirst
                ? "Install on your GitHub account first"
                : "Could not connect GitHub App"}
            </p>
            <p>{safeError.replace(/\*\*/g, "")}</p>
            {needsInstallFirst && installUrl ? (
              <a href={installUrl} className={buttonVariants({ size: "sm", className: "mt-2" })}>
                Install on GitHub
              </a>
            ) : null}
          </div>
        ) : null}

        {!isConnected && diagnostics && signedInWithGitHub ? (
          <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
            <p className="font-medium">Your connection status</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                Signed in as:{" "}
                <strong>
                  {userLogin ? `@${userLogin}` : "GitHub (username loading…)"}
                </strong>
              </li>
              <li>
                App installed on your account:{" "}
                <strong>{diagnostics.yourInstallFound ? "yes" : "not yet"}</strong>
              </li>
            </ul>
          </div>
        ) : null}

        {!signedInWithGitHub && !isConnected ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
            You signed in with email. Sign out and use{" "}
            <strong>Sign in with GitHub</strong> first — repo access is always
            tied to your GitHub identity.
          </p>
        ) : null}

        {isConnected && installation ? (
          <div className="flex flex-col gap-4 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Connected as</p>
              <p className="font-medium">
                @{installation.accountLogin}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({formatGitHubAccountType(installation.accountType)})
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Pull Requests and Repositories now use this GitHub account only.
              </p>
            </div>
            <form action={disconnectGitHubApp}>
              <Button type="submit" variant="outline">
                <Unplug />
                Disconnect
              </Button>
            </form>
          </div>
        ) : canInstall && installUrl ? (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <ConnectOption
                highlighted
                title="Install on GitHub"
                when={
                  userLogin
                    ? `First-time setup for @${userLogin}. Opens GitHub to approve repo access on your account.`
                    : "First-time setup. Opens GitHub to approve repo access on your account."
                }
                steps={[
                  "Stay signed in to ShipFlow as yourself.",
                  "On GitHub, choose your personal account.",
                  "Select which of your repositories ShipFlow may access.",
                  "GitHub returns you here when finished.",
                ]}
                action={
                  <a
                    href={installUrl}
                    className={buttonVariants({ className: "w-full sm:w-fit" })}
                  >
                    Install on GitHub
                  </a>
                }
              />

              <ConnectOption
                title="Link my installation"
                when="Only use this after you already completed Install on GitHub and still see disconnected."
                steps={[
                  "Does not open GitHub.",
                  "Looks up the install on your signed-in account only.",
                  "If you have not installed yet, use Install on GitHub instead.",
                ]}
                action={
                  <form action={linkGitHubInstallation}>
                    <Button type="submit" variant="outline" className="w-full sm:w-fit">
                      <Plug />
                      Link my installation
                    </Button>
                  </form>
                }
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border/60 p-6 text-center">
            <p className="text-sm font-medium">GitHub connection unavailable</p>
            <p className="text-sm text-muted-foreground">
              {isDevelopmentEnvironment()
                ? (configError ??
                  "Add GitHub App settings to your local environment file and restart the dev server.")
                : "GitHub integration is not set up for this site yet. Try again later or contact support."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
