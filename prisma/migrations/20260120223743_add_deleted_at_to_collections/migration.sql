-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Collection_deletedAt_idx" ON "Collection"("deletedAt");
