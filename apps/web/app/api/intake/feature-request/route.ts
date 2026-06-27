import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { createFeatureRequest } from "@repo/services";

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

  let body: {
    workspaceId?: string;
    title?: string;
    description?: string;
    source?: "email" | "ticket" | "call";
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId, title, description, source = "email" } = body;
  if (!workspaceId || !title?.trim() || !description?.trim()) {
    return NextResponse.json(
      { error: "workspaceId, title, and description are required" },
      { status: 400 },
    );
  }

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
    title: title.trim(),
    description: description.trim(),
    source,
  });

  return NextResponse.json({
    id: feature.id,
    status: feature.status,
    url: `/dashboard/feature-requests/${feature.id}`,
  });
}
