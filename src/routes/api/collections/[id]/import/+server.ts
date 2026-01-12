import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { parsePGNFile } from "$lib/server/utils/pgnParser";
import { prisma } from "$lib/server/db";

export const POST: RequestHandler = async ({ request, locals, params }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, "Vous devez être connecté pour importer des parties");
  }

  const { id: collectionId } = params;

  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      proprietaireId: user.id,
    },
  });

  if (!collection) {
    throw error(404, "Collection non trouvée");
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    throw error(400, "Aucun fichier fourni");
  }

  if (!file.name.endsWith(".pgn")) {
    throw error(400, "Le fichier doit être au format PGN");
  }

  try {
    const content = await file.text();
    const games = parsePGNFile(content);

    if (games.length === 0) {
      throw error(400, "Aucune partie valide trouvée dans le fichier");
    }

    let importedCount = 0;

    for (const game of games) {
      try {
        await prisma.partieTravail.create({
          data: {
            collectionId: collectionId,
            titre: `${game.blancNom} vs ${game.noirNom}`,
            resultat: game.resultat,
            blancNom: game.blancNom,
            noirNom: game.noirNom,
            blancElo: game.blancElo,
            noirElo: game.noirElo,
            datePartie: game.datePartie,
            event: game.event,
            site: game.site,
          },
        });
        importedCount++;
      } catch (err) {
        console.error("Erreur lors de l'import d'une partie:", err);
      }
    }

    await prisma.collection.update({
      where: { id: collectionId },
      data: { updatedAt: new Date() },
    });

    return json({
      success: true,
      message: `${importedCount} partie(s) importée(s) avec succès`,
      imported: importedCount,
      total: games.length,
    }, { status: 200 });
  } catch (err) {
    console.error("Erreur lors de l'import:", err);
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    throw error(500, "Erreur lors de l'import des parties");
  }
};
