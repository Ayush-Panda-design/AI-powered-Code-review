import { Octokit } from "octokit";

import { getGitHubApp, getGitHubAppConfigError } from "@/features/github/utils/github-app";
import { prisma } from "@/lib/db";

type GitHubIdentity = {
  accountIds: string[];
  logins: string[];
};

async function getGitHubOAuthAccount(userId: string) {
  return prisma.account.findFirst({
    where: { userId, providerId: "github" },
    select: { accountId: true, accessToken: true },
  });
}

function githubIdFromAvatar(image: string | null | undefined) {
  const match = image?.match(/avatars\.githubusercontent\.com\/u\/(\d+)/i);
  return match?.[1] ?? null;
}

async function resolveGitHubIdentity(userId: string): Promise<GitHubIdentity> {
  const [githubAccount, user] = await Promise.all([
    getGitHubOAuthAccount(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    }),
  ]);

  const accountIds = new Set<string>();
  const logins = new Set<string>();

  if (githubAccount?.accountId?.trim()) {
    accountIds.add(githubAccount.accountId.trim());
  }

  const avatarId = githubIdFromAvatar(user?.image);
  if (avatarId) {
    accountIds.add(avatarId);
  }

  if (githubAccount?.accessToken) {
    try {
      const userOctokit = new Octokit({ auth: githubAccount.accessToken });
      const { data } = await userOctokit.rest.users.getAuthenticated();
      accountIds.add(String(data.id));
      if (data.login) {
        logins.add(data.login.toLowerCase());
      }
    } catch {
      // OAuth token may be expired; id matching still works via accountId/avatar.
    }
  }

  return {
    accountIds: [...accountIds],
    logins: [...logins],
  };
}

function installationAccountLogin(installation: {
  account?: { login?: string | null } | null;
}) {
  const login = installation.account?.login;
  return login ? login.toLowerCase() : null;
}

function installationMatchesIdentity(
  installation: { account?: { id?: number | null; login?: string | null } | null },
  identity: GitHubIdentity,
) {
  const accountId = installation.account?.id;
  if (accountId != null && identity.accountIds.includes(String(accountId))) {
    return true;
  }

  const login = installationAccountLogin(installation);
  return login != null && identity.logins.includes(login);
}

async function listAppInstallations() {
  const app = getGitHubApp();
  return app.octokit.paginate(app.octokit.rest.apps.listInstallations, {
    per_page: 100,
  });
}

async function findInstallationForUser(userId: string) {
  const identity = await resolveGitHubIdentity(userId);

  if (identity.accountIds.length === 0 && identity.logins.length === 0) {
    throw new Error(
      "Sign in with GitHub first, then install the GitHub App on your account.",
    );
  }

  const installations = await listAppInstallations();

  return installations.find((installation) =>
    installationMatchesIdentity(installation, identity),
  );
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
  const identity = await resolveGitHubIdentity(userId);

  if (identity.accountIds.length === 0 && identity.logins.length === 0) {
    throw new Error(
      "Sign in with GitHub first, then install the GitHub App on your account.",
    );
  }

  const account = await getInstallationAccount(installationId);
  if (!account) {
    throw new Error("GitHub App installation not found on GitHub.");
  }

  const matches =
    identity.accountIds.includes(account.id) ||
    (account.login != null &&
      identity.logins.includes(account.login.toLowerCase()));

  if (!matches) {
    throw new Error(
      "This GitHub App installation does not belong to the account you signed in with. Install on GitHub while signed in as your own account.",
    );
  }
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

async function resolveWorkspaceIdForUser(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });
  return membership?.workspaceId ?? null;
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

  const workspaceId = await resolveWorkspaceIdForUser(userId);

  return prisma.gitHubInstallation.upsert({
    where: { userId },
    create: {
      userId,
      workspaceId,
      installationId,
      accountLogin: account.login,
      accountType: account.type ?? "User",
    },
    update: {
      workspaceId,
      installationId,
      accountLogin: account.login,
      accountType: account.type ?? "User",
    },
  });
}

export async function deleteInstallationByGitHubId(installationId: number) {
  await prisma.gitHubInstallation.deleteMany({
    where: { installationId },
  });
}

export async function syncInstallationForUser(userId: string) {
  const identity = await resolveGitHubIdentity(userId);
  const match = await findInstallationForUser(userId);

  if (!match) {
    try {
      await listAppInstallations();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not list GitHub App installs";
      throw new Error(
        `GitHub App server misconfigured: ${message}. Check GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY on Vercel.`,
      );
    }

    const identityHint =
      identity.logins.length > 0
        ? identity.logins[0]!
        : identity.accountIds[0] ?? "";

    throw new Error(
      identityHint
        ? `NO_USER_INSTALL:The GitHub App is not installed on @${identityHint} yet.`
        : "NO_USER_INSTALL:The GitHub App is not installed on your GitHub account yet.",
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

export type GitHubLinkDiagnostics = {
  configError: string | null;
  signedInWithGitHub: boolean;
  identityLogins: string[];
  yourInstallFound: boolean;
  listError: string | null;
};

export async function getGitHubLinkDiagnostics(
  userId: string,
): Promise<GitHubLinkDiagnostics> {
  const configError = getGitHubAppConfigError();
  const githubAccount = await getGitHubOAuthAccount(userId);
  const identity = await resolveGitHubIdentity(userId);

  let yourInstallFound = false;
  let listError: string | null = null;

  if (!configError) {
    try {
      yourInstallFound = Boolean(await findInstallationForUser(userId));
    } catch (error) {
      listError =
        error instanceof Error ? error.message : "Failed to check your installation";
    }
  }

  return {
    configError,
    signedInWithGitHub: Boolean(githubAccount),
    identityLogins: identity.logins,
    yourInstallFound,
    listError,
  };
}

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
