/*
  Warnings:

  - You are about to drop the column `creatorId` on the `Collection` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Collection` table. All the data in the column will be lost.
  - You are about to drop the `CollectionGame` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Game` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `nom` to the `Collection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Visibilite" AS ENUM ('PRIVEE', 'PUBLIQUE');

-- CreateEnum
CREATE TYPE "Resultat" AS ENUM ('BLANCS', 'NOIRS', 'NULLE', 'INCONNU');

-- CreateEnum
CREATE TYPE "Camp" AS ENUM ('BLANCS', 'NOIRS');

-- CreateEnum
CREATE TYPE "CalculStatut" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'TERMINE', 'ERREUR');

-- DropForeignKey
ALTER TABLE "Collection" DROP CONSTRAINT "Collection_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "CollectionGame" DROP CONSTRAINT "CollectionGame_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "CollectionGame" DROP CONSTRAINT "CollectionGame_gameId_fkey";

-- AlterTable
ALTER TABLE "Collection" DROP COLUMN "creatorId",
DROP COLUMN "title",
ADD COLUMN     "nom" TEXT NOT NULL,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "proprietaireId" TEXT,
ADD COLUMN     "visibilite" "Visibilite" NOT NULL DEFAULT 'PRIVEE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "CollectionGame";

-- DropTable
DROP TABLE "Game";

-- CreateTable
CREATE TABLE "CollectionClosure" (
    "ancetreId" TEXT NOT NULL,
    "descendantId" TEXT NOT NULL,
    "profondeur" INTEGER NOT NULL,

    CONSTRAINT "CollectionClosure_pkey" PRIMARY KEY ("ancetreId","descendantId")
);

-- CreateTable
CREATE TABLE "PartieTravail" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "titre" TEXT,
    "resultat" "Resultat" NOT NULL DEFAULT 'INCONNU',
    "blancNom" TEXT,
    "noirNom" TEXT,
    "blancElo" INTEGER,
    "noirElo" INTEGER,
    "datePartie" TIMESTAMP(3),
    "cadence" TEXT,
    "site" TEXT,
    "event" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartieTravail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoupNoeud" (
    "id" TEXT NOT NULL,
    "partieId" TEXT NOT NULL,
    "parentId" TEXT,
    "coupUci" TEXT,
    "ply" INTEGER NOT NULL,
    "hashPosition" BIGINT NOT NULL,
    "fen" TEXT,
    "estPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoupNoeud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentaireNoeud" (
    "id" TEXT NOT NULL,
    "noeudId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentaireNoeud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartieTag" (
    "partieId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "PartieTag_pkey" PRIMARY KEY ("partieId","tagId")
);

-- CreateTable
CREATE TABLE "AgregatCoupsCollection" (
    "collectionId" TEXT NOT NULL,
    "hashPosition" BIGINT NOT NULL,
    "filtreHash" TEXT NOT NULL,
    "coupUci" TEXT NOT NULL,
    "nbParties" BIGINT NOT NULL,
    "victoiresBlancs" BIGINT NOT NULL,
    "nulles" BIGINT NOT NULL,
    "victoiresNoirs" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgregatCoupsCollection_pkey" PRIMARY KEY ("collectionId","hashPosition","filtreHash","coupUci")
);

-- CreateTable
CREATE TABLE "CalculAgregatStatut" (
    "collectionId" TEXT NOT NULL,
    "hashPosition" BIGINT NOT NULL,
    "filtreHash" TEXT NOT NULL,
    "statut" "CalculStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "erreur" TEXT,

    CONSTRAINT "CalculAgregatStatut_pkey" PRIMARY KEY ("collectionId","hashPosition","filtreHash")
);

-- CreateTable
CREATE TABLE "TransitionPartie" (
    "id" TEXT NOT NULL,
    "partieId" TEXT NOT NULL,
    "hashPositionAvant" BIGINT NOT NULL,
    "coupUci" TEXT NOT NULL,
    "hashPositionApres" BIGINT NOT NULL,
    "ply" INTEGER NOT NULL,
    "estDansPrincipal" BOOLEAN NOT NULL DEFAULT true,
    "campAuTrait" "Camp",

    CONSTRAINT "TransitionPartie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollectionClosure_descendantId_idx" ON "CollectionClosure"("descendantId");

-- CreateIndex
CREATE INDEX "CollectionClosure_ancetreId_profondeur_idx" ON "CollectionClosure"("ancetreId", "profondeur");

-- CreateIndex
CREATE INDEX "PartieTravail_collectionId_idx" ON "PartieTravail"("collectionId");

-- CreateIndex
CREATE INDEX "PartieTravail_datePartie_idx" ON "PartieTravail"("datePartie");

-- CreateIndex
CREATE INDEX "PartieTravail_blancElo_idx" ON "PartieTravail"("blancElo");

-- CreateIndex
CREATE INDEX "PartieTravail_noirElo_idx" ON "PartieTravail"("noirElo");

-- CreateIndex
CREATE INDEX "PartieTravail_cadence_idx" ON "PartieTravail"("cadence");

-- CreateIndex
CREATE INDEX "PartieTravail_resultat_idx" ON "PartieTravail"("resultat");

-- CreateIndex
CREATE INDEX "CoupNoeud_partieId_idx" ON "CoupNoeud"("partieId");

-- CreateIndex
CREATE INDEX "CoupNoeud_partieId_parentId_idx" ON "CoupNoeud"("partieId", "parentId");

-- CreateIndex
CREATE INDEX "CoupNoeud_partieId_ply_idx" ON "CoupNoeud"("partieId", "ply");

-- CreateIndex
CREATE INDEX "CoupNoeud_hashPosition_idx" ON "CoupNoeud"("hashPosition");

-- Contrainte unique partielle : un seul coup principal par parent
CREATE UNIQUE INDEX "unique_principal_per_parent" ON "CoupNoeud"("parentId") WHERE "estPrincipal" = true;

-- CreateIndex
CREATE INDEX "CommentaireNoeud_noeudId_idx" ON "CommentaireNoeud"("noeudId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_nom_key" ON "Tag"("nom");

-- CreateIndex
CREATE INDEX "PartieTag_tagId_partieId_idx" ON "PartieTag"("tagId", "partieId");

-- CreateIndex
CREATE INDEX "idx_agregat_top_coups" ON "AgregatCoupsCollection"("collectionId", "hashPosition", "filtreHash", "nbParties" DESC);

-- CreateIndex
CREATE INDEX "idx_agregat_lookup" ON "AgregatCoupsCollection"("collectionId", "hashPosition", "filtreHash");

-- CreateIndex
CREATE INDEX "CalculAgregatStatut_statut_requestedAt_idx" ON "CalculAgregatStatut"("statut", "requestedAt");

-- CreateIndex
CREATE INDEX "TransitionPartie_hashPositionAvant_coupUci_idx" ON "TransitionPartie"("hashPositionAvant", "coupUci");

-- CreateIndex
CREATE INDEX "TransitionPartie_hashPositionAvant_idx" ON "TransitionPartie"("hashPositionAvant");

-- CreateIndex
CREATE INDEX "TransitionPartie_partieId_ply_idx" ON "TransitionPartie"("partieId", "ply");

-- CreateIndex
CREATE INDEX "TransitionPartie_hashPositionAvant_campAuTrait_idx" ON "TransitionPartie"("hashPositionAvant", "campAuTrait");

-- CreateIndex
CREATE INDEX "TransitionPartie_hashPositionAvant_coupUci_partieId_idx" ON "TransitionPartie"("hashPositionAvant", "coupUci", "partieId");

-- CreateIndex
CREATE INDEX "Collection_proprietaireId_idx" ON "Collection"("proprietaireId");

-- CreateIndex
CREATE INDEX "Collection_parentId_idx" ON "Collection"("parentId");

-- CreateIndex
CREATE INDEX "Collection_visibilite_idx" ON "Collection"("visibilite");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionClosure" ADD CONSTRAINT "CollectionClosure_ancetreId_fkey" FOREIGN KEY ("ancetreId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionClosure" ADD CONSTRAINT "CollectionClosure_descendantId_fkey" FOREIGN KEY ("descendantId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartieTravail" ADD CONSTRAINT "PartieTravail_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupNoeud" ADD CONSTRAINT "CoupNoeud_partieId_fkey" FOREIGN KEY ("partieId") REFERENCES "PartieTravail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupNoeud" ADD CONSTRAINT "CoupNoeud_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CoupNoeud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentaireNoeud" ADD CONSTRAINT "CommentaireNoeud_noeudId_fkey" FOREIGN KEY ("noeudId") REFERENCES "CoupNoeud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartieTag" ADD CONSTRAINT "PartieTag_partieId_fkey" FOREIGN KEY ("partieId") REFERENCES "PartieTravail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartieTag" ADD CONSTRAINT "PartieTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgregatCoupsCollection" ADD CONSTRAINT "AgregatCoupsCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculAgregatStatut" ADD CONSTRAINT "CalculAgregatStatut_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionPartie" ADD CONSTRAINT "TransitionPartie_partieId_fkey" FOREIGN KEY ("partieId") REFERENCES "PartieTravail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
