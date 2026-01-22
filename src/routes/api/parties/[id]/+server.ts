import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  
  if (!user) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { id } = params;

  const partie = await prisma.partieTravail.findUnique({
    where: { id },
    include: {
      coups: {
        include: {
          commentaires: {
            orderBy: {
              type: 'asc',
            },
          },
          enfants: {
            include: {
              commentaires: {
                orderBy: {
                  type: 'asc',
                },
              },
            },
          },
        },
        orderBy: {
          ply: 'asc',
        },
      },
      collection: {
        select: {
          proprietaireId: true,
          nom: true,
        },
      },
    },
  });

  if (!partie) {
    return json({ error: 'Partie non trouvée' }, { status: 404 });
  }

  if (partie.collection.proprietaireId !== user.id) {
    return json({ error: 'Non autorisé' }, { status: 403 });
  }

  return json({
    ...partie,
    coups: partie.coups.map(coup => ({
      ...coup,
      hashPosition: coup.hashPosition.toString(),
    })),
  });
};
