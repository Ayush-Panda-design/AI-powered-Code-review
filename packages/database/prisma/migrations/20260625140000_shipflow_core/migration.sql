-- ShipFlow multi-tenant schema

CREATE TABLE "workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "aiCredits" INTEGER NOT NULL DEFAULT 10,
    "repoLimit" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_slug_key" ON "workspace"("slug");

CREATE TABLE "workspace_member" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_member_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "workspace_member_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workspace_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "workspace_member_workspaceId_userId_key" ON "workspace_member"("workspaceId", "userId");

CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "connected_repository" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "repoFullName" TEXT NOT NULL,
    "installationId" INTEGER NOT NULL,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "connected_repository_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "connected_repository_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "connected_repository_projectId_repoFullName_key" ON "connected_repository"("projectId", "repoFullName");

CREATE TABLE "feature_request" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "feature_request_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "feature_request_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "feature_request_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "feature_request_projectId_idx" ON "feature_request"("projectId");
CREATE INDEX "feature_request_status_idx" ON "feature_request"("status");

CREATE TABLE "clarification_message" (
    "id" TEXT NOT NULL,
    "featureRequestId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "clarification_message_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "clarification_message_featureRequestId_fkey" FOREIGN KEY ("featureRequestId") REFERENCES "feature_request"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "clarification_message_featureRequestId_idx" ON "clarification_message"("featureRequestId");

CREATE TABLE "prd" (
    "id" TEXT NOT NULL,
    "featureRequestId" TEXT NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "goals" TEXT NOT NULL,
    "nonGoals" TEXT NOT NULL,
    "userStories" TEXT NOT NULL,
    "acceptanceCriteria" TEXT NOT NULL,
    "edgeCases" TEXT NOT NULL,
    "successMetrics" TEXT NOT NULL,
    "rawMarkdown" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "prd_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "prd_featureRequestId_fkey" FOREIGN KEY ("featureRequestId") REFERENCES "feature_request"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "prd_featureRequestId_key" ON "prd"("featureRequestId");

CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "featureRequestId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "task_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "task_featureRequestId_fkey" FOREIGN KEY ("featureRequestId") REFERENCES "feature_request"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "task_featureRequestId_idx" ON "task"("featureRequestId");
CREATE INDEX "task_status_idx" ON "task"("status");

ALTER TABLE "github_installation" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "github_installation" ADD CONSTRAINT "github_installation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pull_request" ADD COLUMN "featureRequestId" TEXT;
ALTER TABLE "pull_request" ADD COLUMN "projectId" TEXT;
ALTER TABLE "pull_request" ADD COLUMN "repositoryId" TEXT;
ALTER TABLE "pull_request" ADD CONSTRAINT "pull_request_featureRequestId_fkey" FOREIGN KEY ("featureRequestId") REFERENCES "feature_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pull_request" ADD CONSTRAINT "pull_request_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "connected_repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "pull_request_featureRequestId_idx" ON "pull_request"("featureRequestId");

CREATE TABLE "ai_review" (
    "id" TEXT NOT NULL,
    "pullRequestId" TEXT NOT NULL,
    "featureRequestId" TEXT,
    "summary" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "blockingCount" INTEGER NOT NULL DEFAULT 0,
    "nonBlockingCount" INTEGER NOT NULL DEFAULT 0,
    "prdAlignment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_review_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ai_review_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "pull_request"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ai_review_featureRequestId_fkey" FOREIGN KEY ("featureRequestId") REFERENCES "feature_request"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ai_review_pullRequestId_idx" ON "ai_review"("pullRequestId");

CREATE TABLE "release_approval" (
    "id" TEXT NOT NULL,
    "featureRequestId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "release_approval_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "release_approval_featureRequestId_fkey" FOREIGN KEY ("featureRequestId") REFERENCES "feature_request"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "release_approval_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "release_approval_featureRequestId_idx" ON "release_approval"("featureRequestId");

CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "razorpaySubscriptionId" TEXT,
    "razorpayCustomerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "subscription_workspaceId_key" ON "subscription"("workspaceId");
