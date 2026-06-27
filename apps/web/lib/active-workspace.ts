import { cookies } from "next/headers";

import {
  ensureDefaultWorkspace,
  listWorkspacesForUser,
} from "@repo/services";

const WORKSPACE_COOKIE = "shipflow_workspace";

export async function getActiveWorkspaceForUser(userId: string, userName: string) {
  const cookieStore = await cookies();
  const preferredId = cookieStore.get(WORKSPACE_COOKIE)?.value;
  const workspaces = await listWorkspacesForUser(userId);

  if (workspaces.length === 0) {
    return ensureDefaultWorkspace(userId, userName);
  }

  if (preferredId) {
    const match = workspaces.find((workspace) => workspace.id === preferredId);
    if (match) {
      return match;
    }
  }

  return workspaces[0]!;
}

export { WORKSPACE_COOKIE };
