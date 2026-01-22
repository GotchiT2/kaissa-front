import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ fetch, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Unauthorized');
  }

  try {
    const response = await fetch('/api/user/profile');

    if (!response.ok) {
      throw error(response.status, 'Failed to load user profile');
    }

    const data = await response.json();

    return {
      profile: data.profile,
      statistics: data.statistics,
    };
  } catch (err) {
    console.error('Error loading user profile:', err);
    throw error(500, 'Failed to load user profile');
  }
};
