import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/db";

const MAX_PARTIES_IN_ANALYSIS = 5;

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

export const PATCH: RequestHandler = async ({ params, locals, request }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, "Vous devez être connecté pour modifier une partie");
  }

  const partieId = params.id;

  if (!partieId) {
    throw error(400, "L'ID de la partie est requis");
  }

  try {
    const body = await request.json();
    const { isInAnalysis } = body;

    if (typeof isInAnalysis !== "boolean") {
      throw error(400, "Le champ isInAnalysis doit être un booléen");
    }

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
      throw error(403, "Vous n'êtes pas autorisé à modifier cette partie");
    }

    if (isInAnalysis && !partie.isInAnalysis) {
      const countInAnalysis = await prisma.partieTravail.count({
        where: {
          collection: {
            proprietaireId: user.id,
          },
          isInAnalysis: true,
        },
      });

      if (countInAnalysis >= MAX_PARTIES_IN_ANALYSIS) {
        throw error(400, `Vous ne pouvez pas avoir plus de ${MAX_PARTIES_IN_ANALYSIS} parties en analyse simultanément`);
      }
    }

    const updatedPartie = await prisma.partieTravail.update({
      where: { id: partieId },
      data: { isInAnalysis },
    });

    return json({
      success: true,
      message: isInAnalysis 
        ? "Partie ajoutée à l'analyse" 
        : "Partie retirée de l'analyse",
      partie: updatedPartie,
    });
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    console.error("Erreur lors de la mise à jour de la partie:", err);
    throw error(500, "Erreur lors de la mise à jour de la partie");
  }
};
