import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/db";

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, "Non authentifié");
  }

  const partie = await prisma.partieTravail.findFirst({
    where: {
      id: params.id,
      collection: {
        proprietaireId: user.id,
      },
    },
  });

  if (!partie) {
    throw error(404, "Partie non trouvée");
  }

  await prisma.partieTravail.delete({
    where: { id: params.id },
  });

  return json({ success: true, message: "Partie supprimée avec succès" });
};

export const PATCH: RequestHandler = async ({ params, locals, request }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, "Non authentifié");
  }

  const partie = await prisma.partieTravail.findFirst({
    where: {
      id: params.id,
      collection: {
        proprietaireId: user.id,
      },
    },
  });

  if (!partie) {
    throw error(404, "Partie non trouvée");
  }

  const body = await request.json();

  // Si les noms des joueurs sont modifiés, mettre à jour le titre
  if (body.blancNom !== undefined || body.noirNom !== undefined) {
    const blancNom = body.blancNom ?? partie.blancNom ?? "?";
    const noirNom = body.noirNom ?? partie.noirNom ?? "?";
    body.titre = `${blancNom} vs ${noirNom}`;
  }

  await prisma.partieTravail.update({
    where: { id: params.id },
    data: body,
  });

  return json({ success: true, message: "Partie mise à jour avec succès" });
};
