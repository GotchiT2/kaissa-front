import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/db";
import { parseFEN, type FenGameMetadata } from "$lib/server/utils/fenParser";
import { hashFEN } from "$lib/server/utils/positionHash";
import { randomUUID } from "crypto";

export const POST: RequestHandler = async ({ request, locals, params }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, "Vous devez être connecté pour importer des parties");
  }

  const { id: collectionId } = params;

  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      proprietaireId: user.id,
    },
  });

  if (!collection) {
    throw error(404, "Collection non trouvée");
  }

  const body = await request.json();
  const { fen, metadata } = body as { 
    fen: string; 
    metadata: FenGameMetadata 
  };

  if (!fen) {
    throw error(400, "Aucun FEN fourni");
  }

  const fenParse = parseFEN(fen);
  
  if (!fenParse.isValid) {
    throw error(400, fenParse.error || "FEN invalide");
  }

  try {
    const partieId = randomUUID();
    const positionHash = hashFEN(fen);
    const noeudId = randomUUID();

    await prisma.$transaction(async (tx) => {
      await tx.partieTravail.create({
        data: {
          id: partieId,
          collectionId: collectionId,
          titre: `${metadata.blancNom} vs ${metadata.noirNom}`,
          resultat: metadata.resultat,
          blancNom: metadata.blancNom,
          noirNom: metadata.noirNom,
          blancElo: metadata.blancElo,
          noirElo: metadata.noirElo,
          datePartie: metadata.datePartie,
          event: metadata.event,
          site: metadata.site,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await tx.coupNoeud.create({
        data: {
          id: noeudId,
          partieId: partieId,
          parentId: null,
          coupUci: null,
          ply: fenParse.startingPly,
          hashPosition: positionHash,
          fen: fen,
          estPrincipal: true,
          nagCoup: null,
          nagPosition: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    });

    await prisma.collection.update({
      where: { id: collectionId },
      data: { updatedAt: new Date() },
    });

    return json({
      success: true,
      message: "Partie importée avec succès depuis FEN",
      partieId,
    }, { status: 200 });
  } catch (err) {
    console.error("Erreur lors de l'import depuis FEN:", err);
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    throw error(500, "Erreur lors de l'import de la partie depuis FEN");
  }
};
