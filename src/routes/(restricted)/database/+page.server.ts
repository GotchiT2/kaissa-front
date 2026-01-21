import type { PageServerLoad } from "./$types";
import { getUserCollections } from "$lib/server/services/collection.service";
import { getPartiesInAnalysisWithTags } from "$lib/server/services/analysis.service";
import { getUserTags } from "$lib/server/services/tag.service";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    throw new Error("Utilisateur non authentifié");
  }

  const [collections, partiesInAnalysis, tags] = await Promise.all([
    getUserCollections(user.id),
    getPartiesInAnalysisWithTags(user.id),
    getUserTags(user.id),
  ]);

  return {
    collections,
    partiesInAnalysis,
    tags,
  };
};
