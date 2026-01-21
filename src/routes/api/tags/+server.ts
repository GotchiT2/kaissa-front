import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/db";

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, "Vous devez être connecté pour créer un tag");
  }

  try {
    const body = await request.json();
    const { nom } = body;

    if (!nom || typeof nom !== "string") {
      return json({ message: "Le nom du tag est requis" }, { status: 400 });
    }

    const trimmedNom = nom.trim();

    if (trimmedNom.length === 0) {
      return json(
        { message: "Le nom du tag ne peut pas être vide" },
        { status: 400 }
      );
    }

    if (trimmedNom.length > 50) {
      return json(
        { message: "Le nom du tag ne peut pas dépasser 50 caractères" },
        { status: 400 }
      );
    }

    const existingTag = await prisma.tag.findFirst({
      where: {
        nom: trimmedNom,
        proprietaireId: user.id,
      },
    });

    if (existingTag) {
      return json(
        { message: "Un tag avec ce nom existe déjà", tag: existingTag },
        { status: 200 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        nom: trimmedNom,
        proprietaireId: user.id,
      },
    });

    return json(
      {
        success: true,
        tag,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erreur lors de la création du tag:", err);
    throw error(500, "Erreur lors de la création du tag");
  }
};
