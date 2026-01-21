import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/db";

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, "Vous devez être connecté pour supprimer un tag");
  }

  const tagId = params.id;

  if (!tagId) {
    return json({ message: "L'ID du tag est requis" }, { status: 400 });
  }

  try {
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      return json({ message: "Tag non trouvé" }, { status: 404 });
    }

    if (tag.proprietaireId !== user.id) {
      throw error(403, "Vous n'êtes pas autorisé à supprimer ce tag");
    }

    await prisma.tag.delete({
      where: { id: tagId },
    });

    return json(
      {
        success: true,
        message: "Tag supprimé avec succès",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erreur lors de la suppression du tag:", err);
    throw error(500, "Erreur lors de la suppression du tag");
  }
};
