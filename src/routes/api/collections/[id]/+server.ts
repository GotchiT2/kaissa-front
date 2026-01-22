import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/db";

export const PATCH: RequestHandler = async ({ params, locals, request }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, "Vous devez être connecté pour modifier une collection");
  }

  const collectionId = params.id;

  if (!collectionId) {
    throw error(400, "L'ID de la collection est requis");
  }

  try {
    const body = await request.json();
    const { nom } = body;

    if (!nom || nom.trim() === '') {
      throw error(400, "Le nom de la collection est requis");
    }

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw error(404, "Collection introuvable");
    }

    if (collection.proprietaireId !== user.id) {
      throw error(403, "Vous n'êtes pas autorisé à modifier cette collection");
    }

    const updatedCollection = await prisma.collection.update({
      where: { id: collectionId },
      data: { nom: nom.trim() },
    });

    return json({
      success: true,
      message: "Collection mise à jour avec succès",
      collection: updatedCollection,
    });
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    console.error("Erreur lors de la mise à jour de la collection:", err);
    throw error(500, "Erreur lors de la mise à jour de la collection");
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, "Vous devez être connecté pour supprimer une collection");
  }

  const collectionId = params.id;

  if (!collectionId) {
    throw error(400, "L'ID de la collection est requis");
  }

  try {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw error(404, "Collection introuvable");
    }

    if (collection.proprietaireId !== user.id) {
      throw error(403, "Vous n'êtes pas autorisé à supprimer cette collection");
    }

    async function getAllDescendantCollections(collectionId: string): Promise<string[]> {
      const directChildren = await prisma.collection.findMany({
        where: { parentId: collectionId },
        select: { id: true },
      });

      const childIds = directChildren.map(c => c.id);
      const allDescendants = [...childIds];

      for (const childId of childIds) {
        const descendants = await getAllDescendantCollections(childId);
        allDescendants.push(...descendants);
      }

      return allDescendants;
    }

    const descendantIds = await getAllDescendantCollections(collectionId);
    const allCollectionIds = [collectionId, ...descendantIds];

    const partiesCount = await prisma.partieTravail.count({
      where: {
        collectionId: {
          in: allCollectionIds,
        },
      },
    });

    await prisma.collection.updateMany({
      where: {
        id: {
          in: allCollectionIds,
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    performPhysicalDeletion(allCollectionIds).catch((err) => {
      console.error("Erreur lors de la suppression physique en arrière-plan:", err);
    });

    return json({
      success: true,
      message: `Collection marquée pour suppression avec ${partiesCount} partie(s) et ${descendantIds.length} sous-collection(s)`,
      deletedPartiesCount: partiesCount,
      deletedSubCollectionsCount: descendantIds.length,
    });
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    console.error("Erreur lors de la suppression de la collection:", err);
    throw error(500, "Erreur lors de la suppression de la collection");
  }
};

async function performPhysicalDeletion(allCollectionIds: string[]) {
  console.log(`Début de la suppression physique de ${allCollectionIds.length} collection(s)`);

  const BATCH_SIZE = 50;
  let deletedCount = 0;

  const totalPartiesCount = await prisma.partieTravail.count({
    where: {
      collectionId: {
        in: allCollectionIds,
      },
    },
  });

  while (deletedCount < totalPartiesCount) {
    const partiesToDelete = await prisma.partieTravail.findMany({
      where: {
        collectionId: {
          in: allCollectionIds,
        },
      },
      select: { id: true },
      take: BATCH_SIZE,
    });

    if (partiesToDelete.length === 0) break;

    const partieIds = partiesToDelete.map(p => p.id);

    await prisma.coupNoeud.deleteMany({
      where: {
        partieId: {
          in: partieIds,
        },
      },
    });

    await prisma.transitionPartie.deleteMany({
      where: {
        partieId: {
          in: partieIds,
        },
      },
    });

    await prisma.partieTag.deleteMany({
      where: {
        partieId: {
          in: partieIds,
        },
      },
    });

    await prisma.partieTravail.deleteMany({
      where: {
        id: {
          in: partieIds,
        },
      },
    });

    deletedCount += partiesToDelete.length;
    console.log(`Suppression physique: ${deletedCount}/${totalPartiesCount} parties supprimées`);
  }

  await prisma.agregatCoupsCollection.deleteMany({
    where: {
      collectionId: {
        in: allCollectionIds,
      },
    },
  });

  await prisma.collectionClosure.deleteMany({
    where: {
      OR: [
        { ancetreId: { in: allCollectionIds } },
        { descendantId: { in: allCollectionIds } },
      ],
    },
  });

  await prisma.collection.deleteMany({
    where: {
      id: {
        in: allCollectionIds,
      },
    },
  });

  console.log(`Suppression physique terminée: ${allCollectionIds.length} collection(s) et ${totalPartiesCount} partie(s)`);
}
