-- Team plan approvals (multi-approver workflow)
CREATE TABLE IF NOT EXISTS "plan_approval" (
    "id" TEXT NOT NULL,
    "featureRequestId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plan_approval_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "plan_approval_featureRequestId_reviewerId_key"
  ON "plan_approval"("featureRequestId", "reviewerId");
CREATE INDEX IF NOT EXISTS "plan_approval_featureRequestId_idx"
  ON "plan_approval"("featureRequestId");

ALTER TABLE "plan_approval" DROP CONSTRAINT IF EXISTS "plan_approval_featureRequestId_fkey";
ALTER TABLE "plan_approval" ADD CONSTRAINT "plan_approval_featureRequestId_fkey"
  FOREIGN KEY ("featureRequestId") REFERENCES "feature_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "plan_approval" DROP CONSTRAINT IF EXISTS "plan_approval_reviewerId_fkey";
ALTER TABLE "plan_approval" ADD CONSTRAINT "plan_approval_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Workspace member invites
CREATE TABLE IF NOT EXISTS "workspace_invite" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "invitedById" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspace_invite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "workspace_invite_token_key" ON "workspace_invite"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_invite_workspaceId_email_key"
  ON "workspace_invite"("workspaceId", "email");
CREATE INDEX IF NOT EXISTS "workspace_invite_token_idx" ON "workspace_invite"("token");

ALTER TABLE "workspace_invite" DROP CONSTRAINT IF EXISTS "workspace_invite_workspaceId_fkey";
ALTER TABLE "workspace_invite" ADD CONSTRAINT "workspace_invite_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
