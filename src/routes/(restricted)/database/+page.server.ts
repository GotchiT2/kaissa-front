import type { PageServerLoad } from "./$types";
import { getUserCollections } from "$lib/server/services/collection.service";
import type { CollectionWithGames } from "$lib/types/chess.types";
import { prisma } from "$lib/server/db";

export const load: PageServerLoad<{
  collections: CollectionWithGames[];
  partiesInAnalysis: any[];
}> = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    throw new Error("Utilisateur non authentifié");
  }

  const collections = await getUserCollections(user.id);

  const partiesInAnalysis = await prisma.partieTravail.findMany({
    where: {
      collection: {
        proprietaireId: user.id,
      },
      isInAnalysis: true,
    },
    include: {
      coups: {
        where: {
          estPrincipal: true,
        },
        orderBy: {
          ply: 'asc',
        },
      },
      collection: {
        select: {
          nom: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return {
    collections,
    partiesInAnalysis,
  };
};
