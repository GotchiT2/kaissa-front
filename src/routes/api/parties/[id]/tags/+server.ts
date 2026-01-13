import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/db";

export const PUT: RequestHandler = async ({ request, locals, params }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, "Vous devez être connecté");
  }

  const { id: partieId } = params;

  try {
    const partie = await prisma.partieTravail.findFirst({
      where: {
        id: partieId,
        collection: {
          proprietaireId: user.id,
        },
      },
    });

    if (!partie) {
      throw error(404, "Partie non trouvée");
    }

    const body = await request.json();
    const { tagIds } = body;

    if (!Array.isArray(tagIds)) {
      return json(
        { message: "Le paramètre tagIds doit être un tableau" },
        { status: 400 }
      );
    }

    const tags = await prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        proprietaireId: user.id,
      },
    });

    if (tags.length !== tagIds.length) {
      return json(
        { message: "Un ou plusieurs tags sont invalides" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.partieTag.deleteMany({
        where: { partieId },
      });

      if (tagIds.length > 0) {
        await tx.partieTag.createMany({
          data: tagIds.map((tagId: string) => ({
            partieId,
            tagId,
          })),
        });
      }
    });

    return json(
      {
        success: true,
        message: "Tags mis à jour avec succès",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erreur lors de la mise à jour des tags:", err);
    throw error(500, "Erreur lors de la mise à jour des tags");
  }
};
