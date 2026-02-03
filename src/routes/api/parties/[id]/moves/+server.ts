import { json } from "@sveltejs/kit";
import { variantService } from "$lib/server/services/variant.service";
import { hashFEN } from "$lib/utils/positionHash";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    return json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id: partieId } = params;

  try {
    const body = await request.json();
    const { parentId, coupUci, fen, ply } = body;

    if (!coupUci || !fen || typeof ply !== "number") {
      return json(
        { error: "Paramètres manquants : coupUci, fen, ply requis" },
        { status: 400 }
      );
    }

    const hashPosition = hashFEN(fen);

    const newMove = await variantService.createMove({
      partieId,
      parentId: parentId || null,
      coupUci,
      fen,
      hashPosition,
      ply,
    });

    return json({
      success: true,
      move: {
        id: newMove.id,
        coupUci: newMove.coupUci,
        fen: newMove.fen,
        ply: newMove.ply,
        estPrincipal: newMove.estPrincipal,
        ordre: newMove.ordre,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la création du coup:", error);
    return json(
      { error: "Erreur lors de la création du coup" },
      { status: 500 }
    );
  }
};

export const GET: RequestHandler = async ({ params, url, locals }) => {
  if (!locals.user) {
    return json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id: partieId } = params;
  const parentId = url.searchParams.get("parentId");

  try {
    const continuations = await variantService.getContinuations(
      parentId,
      partieId
    );

    return json({
      success: true,
      continuations: continuations.map((c) => ({
        id: c.id,
        coupUci: c.coupUci,
        fen: c.fen,
        ply: c.ply,
        estPrincipal: c.estPrincipal,
        ordre: c.ordre,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des continuations:", error);
    return json(
      { error: "Erreur lors de la récupération des continuations" },
      { status: 500 }
    );
  }
};
