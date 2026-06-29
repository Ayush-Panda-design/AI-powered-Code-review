import { prisma } from "@repo/database";

import { getFeatureRequest } from "./index";

export class FeatureAccessError extends Error {
  constructor(
    readonly status: 403 | 404,
    message: string,
  ) {
    super(message);
    this.name = "FeatureAccessError";
  }
}

export async function assertFeatureWorkspaceMember(
  featureRequestId: string,
  userId: string,
) {
  const feature = await getFeatureRequest(featureRequestId);
  if (!feature) {
    throw new FeatureAccessError(404, "Feature not found");
  }

  const member = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId: feature.project.workspaceId,
    },
  });

  if (!member) {
    throw new FeatureAccessError(403, "Access denied");
  }

  return feature;
}
