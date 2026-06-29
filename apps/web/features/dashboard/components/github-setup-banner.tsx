import Link from "next/link";
import { GitBranch } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { DASHBOARD_BASE_PATH } from "@/features/dashboard/lib/routes";
import type { GitHubConnectionStatus } from "@/features/github/server/installation";
import { getGitHubInstallUrl } from "@/features/github/utils/github-app";

type GitHubSetupBannerProps = {
  userId: string;
  status: GitHubConnectionStatus;
};

export function GitHubSetupBanner({ userId, status }: GitHubSetupBannerProps) {
  if (status.state === "connected") {
    return null;
  }

  const installUrl = getGitHubInstallUrl(userId);

  if (status.state === "needs_github_signin") {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-amber-900 dark:text-amber-200">
            Repository features need GitHub sign-in
          </p>
          <p className="text-amber-800 dark:text-amber-300">
            You are signed in with email. Sign out and sign in with{" "}
            <strong>Sign in with GitHub</strong> to use pull requests, repos, and
            AI reviews on your code.
          </p>
        </div>
        <Link href="/sign-in" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <GitBranch className="size-4" />
          Sign in with GitHub
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="font-medium text-sky-900 dark:text-sky-200">
          One more step: allow repository access
        </p>
        <p className="text-sky-800 dark:text-sky-300">
          You already signed in with GitHub. Grant repo access once on{" "}
          <strong>the same GitHub account</strong> so ShipFlow can sync PRs and
          run reviews. This is not a second login — only a permission screen.
        </p>
      </div>
      {installUrl ? (
        <a href={installUrl} className={buttonVariants({ size: "sm" })}>
          <GitBranch className="size-4" />
          Allow repo access
        </a>
      ) : (
        <Link
          href={`${DASHBOARD_BASE_PATH}/github-app`}
          className={buttonVariants({ size: "sm" })}
        >
          Connect GitHub App
        </Link>
      )}
    </div>
  );
}
