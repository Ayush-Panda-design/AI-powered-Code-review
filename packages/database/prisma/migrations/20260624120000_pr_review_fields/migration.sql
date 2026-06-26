-- AlterTable
ALTER TABLE "pull_request" ADD COLUMN "reviewComment" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3);
