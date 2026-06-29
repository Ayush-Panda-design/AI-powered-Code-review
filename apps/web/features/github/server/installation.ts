import { getGitHubApp } from "@/features/github/utils/github-app";
import { prisma } from "@/lib/db";

async function getGitHubOAuthAccount(userId: string) {
  return prisma.account.findFirst({
    where: { userId, providerId: "github" },
    select: { accountId: true, accessToken: true },
  });
}

/** Find this user's GitHub App install using app credentials + their GitHub user id. */
async function findInstallationForGitHubAccountId(githubAccountId: string) {
  const app = getGitHubApp();
  const installations = await app.octokit.paginate(
    app.octokit.rest.apps.listInstallations,
    { per_page: 100 },
  );

  return installations.find((installation) => {
    const accountId = installation.account?.id;
    return accountId != null && String(accountId) === githubAccountId;
  });
}

async function getInstallationAccount(installationId: number) {
  const app = getGitHubApp();
  const { data } = await app.octokit.rest.apps.getInstallation({
    installation_id: installationId,
  });

  const account = data.account;
  if (!account || !("id" in account) || account.id == null) {
    return null;
  }

  return {
    id: String(account.id),
    login: "login" in account ? account.login : null,
    type: "type" in account ? account.type : null,
  };
}

async function assertUserOwnsInstallation(userId: string, installationId: number) {
  const githubAccount = await getGitHubOAuthAccount(userId);

  if (!githubAccount?.accountId) {
    throw new Error(
      "Sign in with GitHub first, then install the GitHub App on your account.",
    );
  }

  const account = await getInstallationAccount(installationId);
  if (!account) {
    throw new Error("GitHub App installation not found on GitHub.");
  }

  if (account.id === githubAccount.accountId) {
    return;
  }

  throw new Error(
    "This GitHub App installation belongs to a different GitHub account. Install the app on the same account you used to sign in.",
  );
}

export async function getInstallationForUser(userId: string) {
  const installation = await prisma.gitHubInstallation.findUnique({
    where: { userId },
  });

  if (!installation) {
    return null;
  }

  try {
    await assertUserOwnsInstallation(userId, installation.installationId);
    return installation;
  } catch {
    await deleteInstallationForUser(userId);
    return null;
  }
}

export async function saveInstallationFromGitHub(
  userId: string,
  installationId: number,
) {
  await assertUserOwnsInstallation(userId, installationId);

  const account = await getInstallationAccount(installationId);
  if (!account?.login) {
    throw new Error("Installation account not found");
  }

  return prisma.gitHubInstallation.upsert({
    where: { userId },
    create: {
      userId,
      installationId,
      accountLogin: account.login,
      accountType: account.type ?? "User",
    },
    update: {
      installationId,
      accountLogin: account.login,
      accountType: account.type ?? "User",
    },
  });
}

export async function syncInstallationForUser(userId: string) {
  const githubAccount = await getGitHubOAuthAccount(userId);

  if (!githubAccount?.accountId) {
    throw new Error(
      "Sign in with GitHub first, then install the GitHub App on your account.",
    );
  }

  const match = await findInstallationForGitHubAccountId(githubAccount.accountId);

  if (!match) {
    throw new Error(
      "No GitHub App installation found for your GitHub account. Click Install on GitHub, choose your account, and select repositories.",
    );
  }

  return saveInstallationFromGitHub(userId, match.id);
}

export async function deleteInstallationForUser(userId: string) {
  await prisma.gitHubInstallation.deleteMany({
    where: { userId },
  });
}

export type GitHubConnectionStatus =
  | { state: "connected"; accountLogin: string }
  | { state: "needs_install"; signedInWithGitHub: true }
  | { state: "needs_github_signin" };

export async function tryAutoLinkGitHubInstallation(userId: string) {
  const existing = await getInstallationForUser(userId);
  if (existing) {
    return existing;
  }

  try {
    return await syncInstallationForUser(userId);
  } catch {
    return null;
  }
}

export async function getGitHubConnectionStatus(
  userId: string,
): Promise<GitHubConnectionStatus> {
  const installation =
    (await getInstallationForUser(userId)) ??
    (await tryAutoLinkGitHubInstallation(userId));

  if (installation) {
    return { state: "connected", accountLogin: installation.accountLogin };
  }

  const githubAccount = await getGitHubOAuthAccount(userId);
  if (!githubAccount) {
    return { state: "needs_github_signin" };
  }

  return { state: "needs_install", signedInWithGitHub: true };
}
