-- CreateTable
CREATE TABLE "sync_run" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "installationId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "totalRepos" INTEGER NOT NULL DEFAULT 0,
    "completedRepos" INTEGER NOT NULL DEFAULT 0,
    "totalPRs" INTEGER NOT NULL DEFAULT 0,
    "completedPRs" INTEGER NOT NULL DEFAULT 0,
    "syncedPRs" INTEGER NOT NULL DEFAULT 0,
    "queuedReviews" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_run_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_run_workspaceId_status_idx" ON "sync_run"("workspaceId", "status");

-- AddForeignKey
ALTER TABLE "sync_run" ADD CONSTRAINT "sync_run_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
