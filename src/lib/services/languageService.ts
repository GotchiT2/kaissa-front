import { locale } from 'svelte-i18n';

export async function updateUserLanguage(language: string) {
  try {
    const response = await fetch('/api/user/language', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language }),
    });

    if (!response.ok) {
      throw new Error('Failed to update language preference');
    }

    locale.set(language);
    
    return true;
  } catch (error) {
    console.error('Error updating language:', error);
    return false;
  }
}
