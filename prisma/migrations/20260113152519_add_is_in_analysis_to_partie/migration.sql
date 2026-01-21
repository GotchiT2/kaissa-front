-- AlterTable
ALTER TABLE "PartieTravail" ADD COLUMN     "isInAnalysis" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "PartieTravail_isInAnalysis_idx" ON "PartieTravail"("isInAnalysis");
