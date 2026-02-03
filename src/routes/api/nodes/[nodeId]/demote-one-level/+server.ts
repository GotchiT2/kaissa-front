import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { variantService } from '$lib/server/services/variant.service';

export const POST: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;

  if (!user) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    await variantService.demoteVariantOneLevel(params.nodeId);
    return json({ success: true });
  } catch (error) {
    console.error('Error demoting variant one level:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'abaissement de la variante' },
      { status: 500 }
    );
  }
};
