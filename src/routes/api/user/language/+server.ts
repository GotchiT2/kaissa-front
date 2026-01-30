import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';

export const PATCH: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { language } = await request.json();

    if (!language || (language !== 'fr' && language !== 'en' && language !== 'ru')) {
      return json({ message: 'Invalid language. Must be "fr", "en" or "ru"' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { language },
    });

    return json({ message: 'Language updated successfully', language });
  } catch (error) {
    console.error('Error updating user language:', error);
    return json({ message: 'Failed to update language' }, { status: 500 });
  }
};
