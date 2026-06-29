import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { runTasksJob } from "@/features/shipflow/server/run-shipflow-jobs";
import { formatUserFriendlyError } from "@/features/shipflow/server/user-friendly-errors";

/** AI + DB save can exceed the default 10s on cold Neon. */
export const maxDuration = 60;

/**
 * POST /api/shipflow/generate-tasks
 * Runs task generation synchronously (no Inngest).
 * This is faster and doesn't lose jobs on Inngest restart.
 */
export async function POST(request: Request) {
  const session = await requireSession();

  const body = (await request.json().catch(() => null)) as {
    featureRequestId?: string;
  } | null;

  const featureRequestId = body?.featureRequestId;
  if (!featureRequestId) {
    return NextResponse.json({ error: "featureRequestId is required" }, { status: 400 });
  }

  // Verify ownership
  const feature = await prisma.featureRequest.findFirst({
    where: {
      id: featureRequestId,
      project: { workspace: { members: { some: { userId: session.user.id } } } },
    },
    select: { id: true, status: true },
  });

  if (!feature) {
    return NextResponse.json({ error: "Feature not found." }, { status: 404 });
  }

  if (feature.status !== "prd_ready" && feature.status !== "planning") {
    return NextResponse.json(
      { ok: false, error: "Your feature isn't ready for task generation yet. Make sure the PRD is approved first." },
      { status: 400 },
    );
  }

  try {
    const result = await runTasksJob(featureRequestId);
    return NextResponse.json({ ok: true, count: result.count });
  } catch (error) {
    const message = formatUserFriendlyError(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
