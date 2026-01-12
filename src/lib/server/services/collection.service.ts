import { prisma } from "$lib/server/db";

export interface CreateCollectionData {
  nom: string;
  proprietaireId: string;
  parentId?: string;
}

export async function createCollection(data: CreateCollectionData) {
  const { nom, proprietaireId, parentId } = data;

  const collection = await prisma.collection.create({
    data: {
      nom,
      proprietaireId,
      parentId,
      visibilite: "PRIVEE",
    },
  });

  await prisma.collectionClosure.create({
    data: {
      ancetreId: collection.id,
      descendantId: collection.id,
      profondeur: 0,
    },
  });

  if (parentId) {
    const parentClosures = await prisma.collectionClosure.findMany({
      where: {
        descendantId: parentId,
      },
    });

    const closuresToCreate = parentClosures.map((closure) => ({
      ancetreId: closure.ancetreId,
      descendantId: collection.id,
      profondeur: closure.profondeur + 1,
    }));

    await prisma.collectionClosure.createMany({
      data: closuresToCreate,
    });
  }

  return collection;
}

export async function getUserCollections(userId: string) {
  return await prisma.collection.findMany({
    where: {
      proprietaireId: userId,
    },
    include: {
      parties: {
        include: {
          coups: {
            where: {
              estPrincipal: true,
            },
            orderBy: {
              ply: 'asc',
            },
          },
        },
      },
      _count: {
        select: {
          parties: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getCollectionById(collectionId: string, userId: string) {
  return await prisma.collection.findFirst({
    where: {
      id: collectionId,
      proprietaireId: userId,
    },
    include: {
      parties: {
        include: {
          coups: {
            where: {
              estPrincipal: true,
            },
            orderBy: {
              ply: 'asc',
            },
          },
        },
      },
      _count: {
        select: {
          parties: true,
        },
      },
    },
  });
}
