import type { PageServerLoad } from "./$types";
import { prisma } from "$lib/server/db";
import { getUserTags } from "$lib/server/services/tag.service";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    throw new Error("Utilisateur non authentifié");
  }

  const [collections, tags] = await Promise.all([
    prisma.collection.findMany({
      where: {
        proprietaireId: user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        nom: true,
        parentId: true,
        _count: {
          select: {
            parties: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    getUserTags(user.id),
  ]);

  return {
    collections: collections.map(c => ({
      ...c,
      partiesCount: c._count.parties,
    })),
    tags,
  };
};
