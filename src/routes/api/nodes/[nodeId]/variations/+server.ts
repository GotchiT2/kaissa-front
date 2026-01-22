import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';
import { Chess } from 'chess.js';
import { hashFEN } from '$lib/utils/positionHash';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const user = locals.user;
  
  if (!user) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { nodeId } = params;
  const { coupUci } = await request.json();

  if (!coupUci) {
    return json({ error: 'Le coup UCI est requis' }, { status: 400 });
  }

  const parentNode = await prisma.coupNoeud.findUnique({
    where: { id: nodeId },
    include: {
      partie: {
        include: {
          collection: {
            select: {
              proprietaireId: true,
            },
          },
        },
      },
    },
  });

  if (!parentNode) {
    return json({ error: 'Noeud parent non trouvé' }, { status: 404 });
  }

  if (parentNode.partie.collection.proprietaireId !== user.id) {
    return json({ error: 'Non autorisé' }, { status: 403 });
  }

  const game = new Chess();
  
  if (parentNode.fen) {
    game.load(parentNode.fen);
  }

  try {
    const move = game.move(coupUci);
    
    if (!move) {
      return json({ error: 'Coup invalide' }, { status: 400 });
    }

    const newFen = game.fen();
    const hashPosition = hashFEN(newFen);
    const newPly = parentNode.ply + 1;

    const newNode = await prisma.coupNoeud.create({
      data: {
        partieId: parentNode.partieId,
        parentId: nodeId,
        coupUci: move.lan,
        ply: newPly,
        hashPosition,
        fen: newFen,
        estPrincipal: false,
      },
      include: {
        commentaires: true,
        enfants: {
          include: {
            commentaires: true,
          },
        },
      },
    });

    await prisma.partieTravail.update({
      where: { id: parentNode.partieId },
      data: { updatedAt: new Date() },
    });

    return json({
      ...newNode,
      hashPosition: newNode.hashPosition.toString(),
    });
  } catch (error) {
    console.error('Erreur lors de la création de la variante:', error);
    return json({ error: 'Erreur lors de la création de la variante' }, { status: 500 });
  }
};
