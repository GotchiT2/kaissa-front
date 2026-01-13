import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { parsePGNFile } from "$lib/server/utils/pgnParser";
import { prisma } from "$lib/server/db";
import { hashFEN } from "$lib/server/utils/positionHash";
import type { Camp, Resultat } from "@prisma/client";

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

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    throw error(400, "Aucun fichier fourni");
  }

  if (!file.name.endsWith(".pgn")) {
    throw error(400, "Le fichier doit être au format PGN");
  }

  try {
    const content = await file.text();
    const games = parsePGNFile(content);

    if (games.length === 0) {
      throw error(400, "Aucune partie valide trouvée dans le fichier");
    }

    let importedCount = 0;

    for (const game of games) {
      try {
        await prisma.$transaction(async (tx) => {
          const partie = await tx.partieTravail.create({
            data: {
              collectionId: collectionId,
              titre: `${game.blancNom} vs ${game.noirNom}`,
              resultat: game.resultat,
              blancNom: game.blancNom,
              noirNom: game.noirNom,
              blancElo: game.blancElo,
              noirElo: game.noirElo,
              datePartie: game.datePartie,
              event: game.event,
              site: game.site,
            },
          });

          let previousNodeId: string | null = null;

          let previousHashPosition: bigint | null = null;

          for (const move of game.parsedMoves) {
            const positionHash = hashFEN(move.fen);

            const noeud = await tx.coupNoeud.create({
              data: {
                partieId: partie.id,
                parentId: previousNodeId,
                coupUci: move.uci,
                ply: move.ply,
                hashPosition: positionHash,
                fen: move.fen,
                estPrincipal: true,
              },
            });

            if (previousHashPosition !== null && move.uci) {
              const campAuTrait: Camp = move.ply % 2 === 1 ? "BLANCS" : "NOIRS";
              
              await tx.transitionPartie.create({
                data: {
                  partieId: partie.id,
                  hashPositionAvant: previousHashPosition,
                  coupUci: move.uci,
                  hashPositionApres: positionHash,
                  ply: move.ply,
                  estDansPrincipal: true,
                  campAuTrait,
                },
              });
            }

            previousHashPosition = positionHash;
            previousNodeId = noeud.id;
          }
        });

        importedCount++;
      } catch (err) {
        console.error("Erreur lors de l'import d'une partie:", err);
      }
    }

    await prisma.collection.update({
      where: { id: collectionId },
      data: { updatedAt: new Date() },
    });

    await updateAggregates(collectionId);

    return json({
      success: true,
      message: `${importedCount} partie(s) importée(s) avec succès`,
      imported: importedCount,
      total: games.length,
    }, { status: 200 });
  } catch (err) {
    console.error("Erreur lors de l'import:", err);
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    throw error(500, "Erreur lors de l'import des parties");
  }
};

async function updateAggregates(collectionId: string) {
  const filtreHash = "default";

  const transitions = await prisma.transitionPartie.findMany({
    where: {
      partie: {
        collectionId,
      },
      estDansPrincipal: true,
    },
    include: {
      partie: {
        select: {
          id: true,
          resultat: true,
        },
      },
    },
  });

  const aggregatesMap = new Map<string, {
    nbParties: Set<string>;
    victoiresBlancs: number;
    nulles: number;
    victoiresNoirs: number;
  }>();

  for (const transition of transitions) {
    const key = `${transition.hashPositionAvant}|${transition.coupUci}`;
    
    if (!aggregatesMap.has(key)) {
      aggregatesMap.set(key, {
        nbParties: new Set(),
        victoiresBlancs: 0,
        nulles: 0,
        victoiresNoirs: 0,
      });
    }

    const agg = aggregatesMap.get(key)!;
    agg.nbParties.add(transition.partieId);

    if (transition.partie.resultat === "BLANCS") {
      agg.victoiresBlancs++;
    } else if (transition.partie.resultat === "NOIRS") {
      agg.victoiresNoirs++;
    } else if (transition.partie.resultat === "NULLE") {
      agg.nulles++;
    }
  }

  for (const [key, agg] of aggregatesMap.entries()) {
    const [hashPositionStr, coupUci] = key.split('|');
    const hashPosition = BigInt(hashPositionStr);

    await prisma.agregatCoupsCollection.upsert({
      where: {
        collectionId_hashPosition_filtreHash_coupUci: {
          collectionId,
          hashPosition,
          filtreHash,
          coupUci,
        },
      },
      create: {
        collectionId,
        hashPosition,
        filtreHash,
        coupUci,
        nbParties: BigInt(agg.nbParties.size),
        victoiresBlancs: BigInt(agg.victoiresBlancs),
        nulles: BigInt(agg.nulles),
        victoiresNoirs: BigInt(agg.victoiresNoirs),
      },
      update: {
        nbParties: BigInt(agg.nbParties.size),
        victoiresBlancs: BigInt(agg.victoiresBlancs),
        nulles: BigInt(agg.nulles),
        victoiresNoirs: BigInt(agg.victoiresNoirs),
        updatedAt: new Date(),
      },
    });
  }
}
