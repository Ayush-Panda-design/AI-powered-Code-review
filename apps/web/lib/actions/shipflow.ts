"use server";

import { revalidatePath } from "next/cache";

import { inngest } from "@/features/inngest/client";
import { requireSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { ensureDefaultWorkspace } from "@repo/services";

export async function ensureWorkspaceAction() {
  const session = await requireSession();
  const workspace = await ensureDefaultWorkspace(
    session.user.id,
    session.user.name ?? "User",
  );
  return workspace;
}

export async function triggerClarificationAction(featureRequestId: string) {
  await requireSession();
  await inngest.send({
    name: "shipflow/feature.clarify",
    data: { featureRequestId },
  });
  revalidatePath(`/dashboard/feature-requests/${featureRequestId}`);
}

export async function triggerPrdGenerationAction(featureRequestId: string) {
  await requireSession();
  await inngest.send({
    name: "shipflow/prd.generate",
    data: { featureRequestId },
  });
  revalidatePath(`/dashboard/feature-requests/${featureRequestId}`);
}

export async function triggerTaskGenerationAction(featureRequestId: string) {
  await requireSession();
  await inngest.send({
    name: "shipflow/tasks.generate",
    data: { featureRequestId },
  });
  revalidatePath(`/dashboard/feature-requests/${featureRequestId}`);
  revalidatePath("/dashboard/tasks");
}

export async function approveReleaseAction(featureRequestId: string, notes?: string) {
  const session = await requireSession();

  await prisma.releaseApproval.create({
    data: {
      featureRequestId,
      reviewerId: session.user.id,
      decision: "approved",
      notes,
    },
  });

  await prisma.featureRequest.update({
    where: { id: featureRequestId },
    data: { status: "shipped" },
  });

  revalidatePath(`/dashboard/feature-requests/${featureRequestId}`);
}
