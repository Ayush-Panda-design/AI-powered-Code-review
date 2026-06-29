import { GitHubConnectCard } from "@/features/dashboard/components/github-connect-card";
import {
  getGitHubLinkDiagnostics,
  getInstallationForUser,
  tryAutoLinkGitHubInstallation,
} from "@/features/github/server/installation";
import { requireSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";

type GitHubAppPageProps = {
  searchParams: Promise<{ error?: string; detail?: string }>;
};

export default async function GitHubAppPage({ searchParams }: GitHubAppPageProps) {
  const session = await requireSession("/dashboard/github-app");
  const { error, detail } = await searchParams;

  let installation = await getInstallationForUser(session.user.id);
  if (!installation) {
    installation = await tryAutoLinkGitHubInstallation(session.user.id);
  }

  const signedInWithGitHub = Boolean(
    await prisma.account.findFirst({
      where: { userId: session.user.id, providerId: "github" },
      select: { id: true },
    }),
  );

  const diagnostics =
    !installation ? await getGitHubLinkDiagnostics(session.user.id) : null;

  return (
    <GitHubConnectCard
      userId={session.user.id}
      signedInWithGitHub={signedInWithGitHub}
      installation={
        installation
          ? {
              accountLogin: installation.accountLogin,
              accountType: installation.accountType,
            }
          : null
      }
      error={error ?? null}
      errorDetail={detail ?? null}
      diagnostics={diagnostics}
    />
  );
}
