/*
  Warnings:

  - A unique constraint covering the columns `[noeudId,type]` on the table `CommentaireNoeud` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `CommentaireNoeud` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TypeCommentaire" AS ENUM ('AVANT', 'APRES');

-- AlterTable
ALTER TABLE "CommentaireNoeud" ADD COLUMN     "type" "TypeCommentaire" NOT NULL;

-- AlterTable
ALTER TABLE "CoupNoeud" ADD COLUMN     "nagCoup" INTEGER,
ADD COLUMN     "nagPosition" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "CommentaireNoeud_noeudId_type_key" ON "CommentaireNoeud"("noeudId", "type");
