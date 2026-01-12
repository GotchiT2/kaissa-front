import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/db";

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, "Vous devez être connecté pour supprimer une partie");
  }

  const partieId = params.id;

  if (!partieId) {
    throw error(400, "L'ID de la partie est requis");
  }

  try {
    const partie = await prisma.partieTravail.findUnique({
      where: { id: partieId },
      include: {
        collection: {
          select: {
            proprietaireId: true,
          },
        },
      },
    });

    if (!partie) {
      throw error(404, "Partie introuvable");
    }

    if (partie.collection.proprietaireId !== user.id) {
      throw error(403, "Vous n'êtes pas autorisé à supprimer cette partie");
    }

    await prisma.partieTravail.delete({
      where: { id: partieId },
    });

    return json({
      success: true,
      message: "Partie supprimée avec succès",
    });
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    console.error("Erreur lors de la suppression de la partie:", err);
    throw error(500, "Erreur lors de la suppression de la partie");
  }
};
