import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createCollection } from "$lib/server/services/collection.service";

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, "Vous devez être connecté pour créer une collection");
  }

  const body = await request.json();
  const { nom } = body;

  if (!nom || typeof nom !== "string" || nom.trim().length === 0) {
    throw error(400, "Le nom de la collection est requis");
  }

  if (nom.trim().length > 100) {
    throw error(400, "Le nom de la collection ne peut pas dépasser 100 caractères");
  }

  try {
    const collection = await createCollection({
      nom: nom.trim(),
      proprietaireId: user.id,
    });

    return json({
      success: true,
      collection,
    }, { status: 201 });
  } catch (err) {
    console.error("Erreur lors de la création de la collection:", err);
    throw error(500, "Erreur lors de la création de la collection");
  }
};
