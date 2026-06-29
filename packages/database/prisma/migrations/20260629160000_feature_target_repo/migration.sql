ALTER TABLE "feature_request" ADD COLUMN "targetRepositoryId" TEXT;

ALTER TABLE "feature_request"
  ADD CONSTRAINT "feature_request_targetRepositoryId_fkey"
  FOREIGN KEY ("targetRepositoryId")
  REFERENCES "connected_repository"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
