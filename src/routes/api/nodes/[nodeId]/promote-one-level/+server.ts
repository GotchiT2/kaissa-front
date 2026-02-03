import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { variantService } from '$lib/server/services/variant.service';

export const POST: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;

  if (!user) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    await variantService.promoteVariantOneLevel(params.nodeId);
    return json({ success: true });
  } catch (error) {
    console.error('Error promoting variant one level:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la promotion de la variante' },
      { status: 500 }
    );
  }
};
