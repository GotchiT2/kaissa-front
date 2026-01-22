import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/db";

export const GET: RequestHandler = async ({ params, url, locals }) => {
  const user = locals.user;

  if (!user) {
    return json({ message: "Vous devez être connecté" }, { status: 401 });
  }

  const collectionId = params.id;
  const hashPosition = url.searchParams.get("hashPosition");

  if (!hashPosition) {
    return json({ message: "Le paramètre hashPosition est requis" }, { status: 400 });
  }

  try {
    const hashPositionBigInt = BigInt(hashPosition);

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      return json({ message: "Collection non trouvée" }, { status: 404 });
    }

    if (collection.proprietaireId !== user.id) {
      return json({ message: "Accès non autorisé à cette collection" }, { status: 403 });
    }

    const topMoves = await prisma.agregatCoupsCollection.findMany({
      where: {
        collectionId,
        hashPosition: hashPositionBigInt,
      },
      orderBy: {
        nbParties: "desc",
      },
      take: 6,
    });

    const movesWithElo = await Promise.all(
      topMoves.map(async (move) => {
        const transitions = await prisma.transitionPartie.findMany({
          where: {
            hashPositionAvant: hashPositionBigInt,
            coupUci: move.coupUci,
            partie: {
              collectionId,
            },
          },
          include: {
            partie: {
              select: {
                blancElo: true,
                noirElo: true,
              },
            },
          },
        });

        const eloValues = transitions
          .map(t => {
            if (t.campAuTrait === 'BLANCS' && t.partie.blancElo) {
              return t.partie.blancElo;
            }
            if (t.campAuTrait === 'NOIRS' && t.partie.noirElo) {
              return t.partie.noirElo;
            }
            return null;
          })
          .filter((elo): elo is number => elo !== null);

        const eloMoyen = eloValues.length > 0
          ? Math.round(eloValues.reduce((sum, elo) => sum + elo, 0) / eloValues.length)
          : null;

        return {
          coup: move.coupUci,
          nbParties: Number(move.nbParties),
          victoiresBlancs: Number(move.victoiresBlancs),
          nulles: Number(move.nulles),
          victoiresNoirs: Number(move.victoiresNoirs),
          eloMoyen,
        };
      })
    );

    return json({
      moves: movesWithElo,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des meilleurs coups:", error);
    return json(
      { message: "Erreur lors de la récupération des meilleurs coups" },
      { status: 500 }
    );
  }
};
