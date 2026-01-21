import type { PageServerLoad } from "./$types";
import { getPartiesInAnalysis } from "$lib/server/services/analysis.service";
import { getUserCollectionsSimple } from "$lib/server/services/collection.service";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    throw new Error("Utilisateur non authentifié");
  }

  const [partiesInAnalysis, collections] = await Promise.all([
    getPartiesInAnalysis(user.id),
    getUserCollectionsSimple(user.id),
  ]);

  return {
    partiesInAnalysis,
    collections,
  };
};
