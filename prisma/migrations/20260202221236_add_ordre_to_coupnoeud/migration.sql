-- AlterTable
ALTER TABLE "CoupNoeud" ADD COLUMN     "ordre" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "CoupNoeud_parentId_ordre_idx" ON "CoupNoeud"("parentId", "ordre");
