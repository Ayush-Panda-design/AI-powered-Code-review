import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createFeatureRequest, queueAutoClarification } from "@repo/services";

const intakeBodySchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10_000),
  source: z.enum(["email", "ticket", "call"]).default("email"),
});

async function getOrCreateDefaultProject(workspaceId: string) {
  const existing = await prisma.project.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.project.create({
    data: {
      workspaceId,
      name: "Default Project",
      description: "Main product delivery pipeline",
    },
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.SHIPFLOW_INTAKE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Intake API not configured" },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(
    `intake:${getClientIp(request)}`,
    30,
    60_000,
  );
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = intakeBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { workspaceId, title, description, source } = parsed.data;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const project = await getOrCreateDefaultProject(workspaceId);
  const feature = await createFeatureRequest({
    projectId: project.id,
    title,
    description,
    source,
  });

  if (feature.status === "draft") {
    await queueAutoClarification(feature.id);
  }

  return NextResponse.json({
    id: feature.id,
    status: feature.status,
    url: `/dashboard/feature-requests/${feature.id}`,
  });
}
