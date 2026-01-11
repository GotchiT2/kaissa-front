import type { PageServerLoad } from "./$types";
import { getUserCollections } from "$lib/server/services/collection.service";
import type { CollectionWithGames } from "$lib/types/chess.types";

export const load: PageServerLoad<{
  collections: CollectionWithGames[];
}> = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    throw new Error("Utilisateur non authentifié");
  }

  const collections = await getUserCollections(user.id);

  return {
    collections,
  };
};
