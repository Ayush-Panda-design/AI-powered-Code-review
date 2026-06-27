import { randomBytes } from "node:crypto";

import { prisma } from "@repo/database";

const INVITE_TTL_DAYS = 7;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function assertWorkspaceMember(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });

  if (!member) {
    throw new Error("Workspace not found");
  }

  return member;
}

export async function listWorkspaceMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listWorkspaceInvites(workspaceId: string) {
  return prisma.workspaceInvite.findMany({
    where: { workspaceId, status: "pending", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

export async function inviteWorkspaceMember(input: {
  workspaceId: string;
  invitedById: string;
  email: string;
  role?: string;
  appBaseUrl: string;
}) {
  await assertWorkspaceMember(input.workspaceId, input.invitedById);

  const email = normalizeEmail(input.email);
  if (!email.includes("@")) {
    throw new Error("Enter a valid email address");
  }

  const existingMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: input.workspaceId,
      user: { email },
    },
  });

  if (existingMember) {
    throw new Error("This user is already a workspace member");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    await prisma.workspaceMember.create({
      data: {
        workspaceId: input.workspaceId,
        userId: existingUser.id,
        role: input.role ?? "member",
      },
    });

    return {
      type: "added" as const,
      email,
    };
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

  await prisma.workspaceInvite.upsert({
    where: {
      workspaceId_email: {
        workspaceId: input.workspaceId,
        email,
      },
    },
    create: {
      workspaceId: input.workspaceId,
      email,
      role: input.role ?? "member",
      invitedById: input.invitedById,
      token,
      expiresAt,
    },
    update: {
      token,
      status: "pending",
      expiresAt,
      invitedById: input.invitedById,
    },
  });

  const inviteUrl = `${input.appBaseUrl.replace(/\/$/, "")}/invite/${token}`;

  return {
    type: "invited" as const,
    email,
    inviteUrl,
  };
}

export async function acceptWorkspaceInvite(token: string, userId: string) {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
  });

  if (!invite || invite.status !== "pending") {
    throw new Error("Invite not found or already used");
  }

  if (invite.expiresAt < new Date()) {
    throw new Error("Invite has expired");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user || normalizeEmail(user.email) !== normalizeEmail(invite.email)) {
    throw new Error("This invite was sent to a different email address");
  }

  await prisma.$transaction([
    prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId,
        },
      },
      create: {
        workspaceId: invite.workspaceId,
        userId,
        role: invite.role,
      },
      update: {},
    }),
    prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    }),
  ]);

  return { workspaceId: invite.workspaceId };
}
