-- Workspace review settings
ALTER TABLE "workspace" ADD COLUMN IF NOT EXISTS "mutedReviewCategories" TEXT;

-- PRD AI draft snapshot
ALTER TABLE "prd" ADD COLUMN IF NOT EXISTS "aiDraftMarkdown" TEXT;

-- Task codegen fields
ALTER TABLE "task" ADD COLUMN IF NOT EXISTS "codeGenStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "task" ADD COLUMN IF NOT EXISTS "aiGeneratable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "task" ADD COLUMN IF NOT EXISTS "draftPullRequestId" TEXT;

-- Pull request metrics and source
ALTER TABLE "pull_request" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'human';
ALTER TABLE "pull_request" ADD COLUMN IF NOT EXISTS "filesChanged" INTEGER;
ALTER TABLE "pull_request" ADD COLUMN IF NOT EXISTS "additions" INTEGER;
ALTER TABLE "pull_request" ADD COLUMN IF NOT EXISTS "deletions" INTEGER;
ALTER TABLE "pull_request" ADD COLUMN IF NOT EXISTS "linesChanged" INTEGER;
ALTER TABLE "pull_request" ADD COLUMN IF NOT EXISTS "sizeWarning" TEXT;

-- Learned review rules (false-positive suppression)
CREATE TABLE IF NOT EXISTS "review_rule" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "repoFullName" TEXT,
    "pattern" TEXT NOT NULL,
    "category" TEXT,
    "filePath" TEXT,
    "reason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'false_positive',
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_rule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "review_rule_workspaceId_idx" ON "review_rule"("workspaceId");

ALTER TABLE "review_rule" DROP CONSTRAINT IF EXISTS "review_rule_workspaceId_fkey";
ALTER TABLE "review_rule" ADD CONSTRAINT "review_rule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Org activity feed
CREATE TABLE IF NOT EXISTS "activity_event" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "activity_event_workspaceId_createdAt_idx" ON "activity_event"("workspaceId", "createdAt");

ALTER TABLE "activity_event" DROP CONSTRAINT IF EXISTS "activity_event_workspaceId_fkey";
ALTER TABLE "activity_event" ADD CONSTRAINT "activity_event_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
