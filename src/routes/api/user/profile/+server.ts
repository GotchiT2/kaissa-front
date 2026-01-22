import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nationality: true,
        language: true,
      },
    });

    if (!userProfile) {
      return json({ message: 'User not found' }, { status: 404 });
    }

    const [collectionsCount, tagsCount, partiesCount] = await Promise.all([
      prisma.collection.count({
        where: {
          proprietaireId: user.id,
          deletedAt: null,
        },
      }),
      prisma.tag.count({
        where: {
          proprietaireId: user.id,
        },
      }),
      prisma.partieTravail.count({
        where: {
          collection: {
            proprietaireId: user.id,
            deletedAt: null,
          },
        },
      }),
    ]);

    return json({
      profile: userProfile,
      statistics: {
        collectionsCount,
        partiesCount,
        tagsCount,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return json({ message: 'Failed to fetch user profile' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { firstName, lastName, nationality } = await request.json();

    if (!firstName || !lastName || !nationality) {
      return json({ message: 'Missing required fields' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        nationality,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nationality: true,
        language: true,
      },
    });

    return json({ profile: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return json({ message: 'Failed to update user profile' }, { status: 500 });
  }
};
