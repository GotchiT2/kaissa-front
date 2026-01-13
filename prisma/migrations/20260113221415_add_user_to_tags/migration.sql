-- DropIndex (remove unique constraint on nom)
DROP INDEX IF EXISTS "Tag_nom_key";

-- Delete existing tags (since they don't have a proprietaireId yet)
DELETE FROM "PartieTag";
DELETE FROM "Tag";

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Tag" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Tag" ADD COLUMN "proprietaireId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tag_proprietaireId_nom_key" ON "Tag"("proprietaireId", "nom");

-- CreateIndex
CREATE INDEX "Tag_proprietaireId_idx" ON "Tag"("proprietaireId");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
