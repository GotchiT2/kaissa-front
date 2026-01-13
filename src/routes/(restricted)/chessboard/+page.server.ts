import type { PageServerLoad } from "./$types";
import { prisma } from "$lib/server/db";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    throw new Error("Utilisateur non authentifié");
  }

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
    partiesInAnalysis,
  };
};
