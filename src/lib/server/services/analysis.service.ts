import { prisma } from "$lib/server/db";

export async function getPartiesInAnalysis(userId: string) {
  return await prisma.partieTravail.findMany({
    where: {
      collection: {
        proprietaireId: userId,
        deletedAt: null,
      },
      isInAnalysis: true,
    },
    include: {
      coups: {
        orderBy: [
          { ply: "asc" },
          { estPrincipal: "desc" },
          { ordre: "asc" },
        ],
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
}

export async function getPartiesInAnalysisWithTags(userId: string) {
  return await prisma.partieTravail.findMany({
    where: {
      collection: {
        proprietaireId: userId,
      },
      isInAnalysis: true,
    },
    include: {
      coups: {
        where: {
          estPrincipal: true,
        },
        orderBy: {
          ply: "asc",
        },
      },
      collection: {
        select: {
          nom: true,
        },
      },
      tags: {
        select: {
          tagId: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}
