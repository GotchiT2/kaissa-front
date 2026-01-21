import { prisma } from "$lib/server/db";

export async function getUserTags(userId: string) {
  return await prisma.tag.findMany({
    where: {
      proprietaireId: userId,
    },
    include: {
      _count: {
        select: {
          parties: true,
        },
      },
      parties: {
        include: {
          partie: {
            include: {
              coups: {
                where: {
                  estPrincipal: true,
                },
                orderBy: {
                  ply: "asc",
                },
              },
              tags: {
                select: {
                  tagId: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      nom: "asc",
    },
  });
}
