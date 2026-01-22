import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;

  if (!user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { nodeId } = params;

  try {
    const [comments, node] = await Promise.all([
      prisma.commentaireNoeud.findMany({
        where: {
          noeudId: nodeId,
        },
        select: {
          id: true,
          type: true,
          contenu: true,
        },
      }),
      prisma.coupNoeud.findUnique({
        where: {
          id: nodeId,
        },
        select: {
          nagCoup: true,
          nagPosition: true,
        },
      }),
    ]);

    const response = {
      avant: comments.find(c => c.type === 'AVANT')?.contenu || '',
      apres: comments.find(c => c.type === 'APRES')?.contenu || '',
      nagCoup: node?.nagCoup || null,
      nagPosition: node?.nagPosition || null,
    };

    return json(response);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return json({ message: 'Failed to fetch comments' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const user = locals.user;

  if (!user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { nodeId } = params;

  try {
    const { avant, apres, nagCoup, nagPosition } = await request.json();

    if (avant !== undefined && avant !== null) {
      if (avant.length > 2000) {
        return json({ message: 'Comment before move is too long (max 2000 characters)' }, { status: 400 });
      }

      if (avant.trim() === '') {
        await prisma.commentaireNoeud.deleteMany({
          where: {
            noeudId: nodeId,
            type: 'AVANT',
          },
        });
      } else {
        await prisma.commentaireNoeud.upsert({
          where: {
            noeudId_type: {
              noeudId: nodeId,
              type: 'AVANT',
            },
          },
          create: {
            noeudId: nodeId,
            type: 'AVANT',
            contenu: avant.trim(),
          },
          update: {
            contenu: avant.trim(),
          },
        });
      }
    }

    if (apres !== undefined && apres !== null) {
      if (apres.length > 2000) {
        return json({ message: 'Comment after move is too long (max 2000 characters)' }, { status: 400 });
      }

      if (apres.trim() === '') {
        await prisma.commentaireNoeud.deleteMany({
          where: {
            noeudId: nodeId,
            type: 'APRES',
          },
        });
      } else {
        await prisma.commentaireNoeud.upsert({
          where: {
            noeudId_type: {
              noeudId: nodeId,
              type: 'APRES',
            },
          },
          create: {
            noeudId: nodeId,
            type: 'APRES',
            contenu: apres.trim(),
          },
          update: {
            contenu: apres.trim(),
          },
        });
      }
    }

    if (nagCoup !== undefined) {
      await prisma.coupNoeud.update({
        where: { id: nodeId },
        data: { nagCoup: nagCoup === null || nagCoup === 0 ? null : nagCoup },
      });
    }

    if (nagPosition !== undefined) {
      await prisma.coupNoeud.update({
        where: { id: nodeId },
        data: { nagPosition: nagPosition === null || nagPosition === 0 ? null : nagPosition },
      });
    }

    return json({ message: 'Comments and annotations updated successfully' });
  } catch (error) {
    console.error('Error updating comments:', error);
    return json({ message: 'Failed to update comments' }, { status: 500 });
  }
};
