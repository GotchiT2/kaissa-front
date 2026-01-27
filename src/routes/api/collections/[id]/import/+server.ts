import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { parsePGNFile } from "$lib/server/utils/pgnParser";
import { prisma } from "$lib/server/db";
import { hashFEN } from "$lib/server/utils/positionHash";
import type { Camp } from "@prisma/client";
import { randomUUID } from "crypto";

const BATCH_SIZE = 100;

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
  const stream = formData.get("stream") as string;

  if (!file) {
    throw error(400, "Aucun fichier fourni");
  }

  if (!file.name.endsWith(".pgn")) {
    throw error(400, "Le fichier doit être au format PGN");
  }

  const content = await file.text();
  const games = parsePGNFile(content);

  if (games.length === 0) {
    throw error(400, "Aucune partie valide trouvée dans le fichier");
  }

  if (stream === "true") {
    const encoder = new TextEncoder();
    let closed = false;

    const readableStream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: unknown) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`event: ${event}\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch {
            closed = true;
          }
        };

        sendEvent("start", { total: games.length });

        let importedCount = 0;

        for (let batchStart = 0; batchStart < games.length; batchStart += BATCH_SIZE) {
          const batchEnd = Math.min(batchStart + BATCH_SIZE, games.length);
          const batchGames = games.slice(batchStart, batchEnd);

          try {
            await prisma.$transaction(async (tx) => {
              const partiesData = [];
              const allNoeudsData = [];
              const allTransitionsData = [];

              for (const game of batchGames) {
                const partieId = randomUUID();

                partiesData.push({
                  id: partieId,
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
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });

                let previousNodeId: string | null = null;
                let previousHashPosition: bigint | null = null;

                for (const move of game.parsedMoves) {
                  const positionHash = hashFEN(move.fen);
                  const noeudId = randomUUID();

                  allNoeudsData.push({
                    id: noeudId,
                    partieId: partieId,
                    parentId: previousNodeId,
                    coupUci: move.uci,
                    ply: move.ply,
                    hashPosition: positionHash,
                    fen: move.fen,
                    estPrincipal: true,
                    nagCoup: null,
                    nagPosition: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });

                  if (previousHashPosition !== null && move.uci) {
                    const campAuTrait: Camp = move.ply % 2 === 1 ? "BLANCS" : "NOIRS";

                    allTransitionsData.push({
                      id: randomUUID(),
                      partieId: partieId,
                      hashPositionAvant: previousHashPosition,
                      coupUci: move.uci,
                      hashPositionApres: positionHash,
                      ply: move.ply,
                      estDansPrincipal: true,
                      campAuTrait,
                    });
                  }

                  previousHashPosition = positionHash;
                  previousNodeId = noeudId;
                }
              }

              if (partiesData.length > 0) {
                await tx.partieTravail.createMany({
                  data: partiesData,
                  skipDuplicates: true,
                });
              }

              if (allNoeudsData.length > 0) {
                await tx.coupNoeud.createMany({
                  data: allNoeudsData,
                  skipDuplicates: true,
                });
              }

              if (allTransitionsData.length > 0) {
                await tx.transitionPartie.createMany({
                  data: allTransitionsData,
                  skipDuplicates: true,
                });
              }

              importedCount += batchGames.length;
            });

            sendEvent("progress", { current: importedCount, total: games.length });
          } catch (err) {
            console.error("Erreur lors de l'import d'un batch:", err);
          }
        }

        await prisma.collection.update({
          where: { id: collectionId },
          data: { updatedAt: new Date() },
        });

        await updateAggregatesOptimized(collectionId);

        sendEvent("complete", { 
          imported: importedCount, 
          total: games.length,
          message: `${importedCount} partie(s) importée(s) avec succès`
        });

        try {
          controller.close();
        } catch {}
      },

      cancel() {
        closed = true;
      }
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  }

  try {
    let importedCount = 0;

    for (let batchStart = 0; batchStart < games.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, games.length);
      const batchGames = games.slice(batchStart, batchEnd);

      try {
        await prisma.$transaction(async (tx) => {
          const partiesData = [];
          const allNoeudsData = [];
          const allTransitionsData = [];

          for (const game of batchGames) {
            const partieId = randomUUID();

            partiesData.push({
              id: partieId,
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
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            let previousNodeId: string | null = null;
            let previousHashPosition: bigint | null = null;

            for (const move of game.parsedMoves) {
              const positionHash = hashFEN(move.fen);
              const noeudId = randomUUID();

              allNoeudsData.push({
                id: noeudId,
                partieId: partieId,
                parentId: previousNodeId,
                coupUci: move.uci,
                ply: move.ply,
                hashPosition: positionHash,
                fen: move.fen,
                estPrincipal: true,
                nagCoup: null,
                nagPosition: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              });

              if (previousHashPosition !== null && move.uci) {
                const campAuTrait: Camp = move.ply % 2 === 1 ? "BLANCS" : "NOIRS";

                allTransitionsData.push({
                  id: randomUUID(),
                  partieId: partieId,
                  hashPositionAvant: previousHashPosition,
                  coupUci: move.uci,
                  hashPositionApres: positionHash,
                  ply: move.ply,
                  estDansPrincipal: true,
                  campAuTrait,
                });
              }

              previousHashPosition = positionHash;
              previousNodeId = noeudId;
            }
          }

          if (partiesData.length > 0) {
            await tx.partieTravail.createMany({
              data: partiesData,
              skipDuplicates: true,
            });
          }

          if (allNoeudsData.length > 0) {
            await tx.coupNoeud.createMany({
              data: allNoeudsData,
              skipDuplicates: true,
            });
          }

          if (allTransitionsData.length > 0) {
            await tx.transitionPartie.createMany({
              data: allTransitionsData,
              skipDuplicates: true,
            });
          }

          importedCount += batchGames.length;
        });
      } catch (err) {
        console.error("Erreur lors de l'import d'un batch:", err);
      }
    }

    await prisma.collection.update({
      where: { id: collectionId },
      data: { updatedAt: new Date() },
    });

    await updateAggregatesOptimized(collectionId);

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

async function updateAggregatesOptimized(collectionId: string) {
  const filtreHash = "default";

  await prisma.$executeRaw`
    INSERT INTO "AgregatCoupsCollection" (
      "collectionId",
      "hashPosition",
      "filtreHash",
      "coupUci",
      "nbParties",
      "victoiresBlancs",
      "nulles",
      "victoiresNoirs",
      "createdAt",
      "updatedAt"
    )
    SELECT
      ${collectionId}::text as "collectionId",
      t."hashPositionAvant" as "hashPosition",
      ${filtreHash}::text as "filtreHash",
      t."coupUci",
      COUNT(DISTINCT t."partieId")::bigint as "nbParties",
      COUNT(DISTINCT CASE WHEN p."resultat" = 'BLANCS' THEN t."partieId" END)::bigint as "victoiresBlancs",
      COUNT(DISTINCT CASE WHEN p."resultat" = 'NULLE' THEN t."partieId" END)::bigint as "nulles",
      COUNT(DISTINCT CASE WHEN p."resultat" = 'NOIRS' THEN t."partieId" END)::bigint as "victoiresNoirs",
      NOW() as "createdAt",
      NOW() as "updatedAt"
    FROM "TransitionPartie" t
    INNER JOIN "PartieTravail" p ON t."partieId" = p.id
    WHERE p."collectionId" = ${collectionId}
      AND t."estDansPrincipal" = true
    GROUP BY t."hashPositionAvant", t."coupUci"
    ON CONFLICT ("collectionId", "hashPosition", "filtreHash", "coupUci")
    DO UPDATE SET
      "nbParties" = EXCLUDED."nbParties",
      "victoiresBlancs" = EXCLUDED."victoiresBlancs",
      "nulles" = EXCLUDED."nulles",
      "victoiresNoirs" = EXCLUDED."victoiresNoirs",
      "updatedAt" = NOW()
  `;
}
