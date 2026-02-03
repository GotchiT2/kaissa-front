import { json } from "@sveltejs/kit";
import { variantService } from "$lib/server/services/variant.service";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: "Non authentifié" }, { status: 401 });
  }

  const { moveId } = params;

  try {
    await variantService.promoteVariant(moveId);

    return json({
      success: true,
      message: "Variante promue avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la promotion de la variante:", error);
    return json(
      { error: "Erreur lors de la promotion de la variante" },
      { status: 500 }
    );
  }
};
