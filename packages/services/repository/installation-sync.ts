import { prisma } from "@repo/database";

import { recordActivityEvent } from "../activity";

export async function syncInstallationRepositories(input: {
  installationId: number;
  repositoriesAdded?: Array<{ full_name: string }>;
  repositoriesRemoved?: Array<{ full_name: string }>;
}) {
  const installation = await prisma.gitHubInstallation.findFirst({
    where: { installationId: input.installationId },
    select: { workspaceId: true },
  });

  const workspaceId = installation?.workspaceId;
  let removedCount = 0;

  if (workspaceId && input.repositoriesRemoved?.length) {
    for (const repository of input.repositoriesRemoved) {
      const result = await prisma.connectedRepository.deleteMany({
        where: {
          repoFullName: repository.full_name,
          installationId: input.installationId,
          project: { workspaceId },
        },
      });
      removedCount += result.count;
    }
  }

  const added = input.repositoriesAdded ?? [];
  if (workspaceId && added.length > 0) {
    await recordActivityEvent({
      workspaceId,
      type: "github_repos_added",
      title: `${added.length} repo(s) added to GitHub App`,
      detail: added.map((repository) => repository.full_name).join(", "),
      metadata: {
        installationId: input.installationId,
        repositories: added.map((repository) => repository.full_name),
      },
    });
  }

  return { removedCount, addedCount: added.length, workspaceId: workspaceId ?? null };
}
