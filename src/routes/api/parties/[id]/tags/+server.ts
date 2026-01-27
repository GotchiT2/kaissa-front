import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/db";

export const PUT: RequestHandler = async ({ params, locals, request }) => {
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

  const { tagIds } = await request.json();

  if (!Array.isArray(tagIds)) {
    throw error(400, "tagIds doit être un tableau");
  }

  await prisma.partieTag.deleteMany({
    where: { partieId: params.id },
  });

  if (tagIds.length > 0) {
    await prisma.partieTag.createMany({
      data: tagIds.map((tagId: string) => ({
        partieId: params.id,
        tagId,
      })),
    });
  }

  return json({ success: true, message: "Tags mis à jour avec succès" });
};
