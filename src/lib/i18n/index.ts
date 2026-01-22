import { addMessages, init, getLocaleFromNavigator, locale } from 'svelte-i18n';
import en from './locales/en';
import fr from './locales/fr';

addMessages('en', en);
addMessages('fr', fr);

// Initialisation par défaut pour le SSR
init({
  fallbackLocale: 'en',
  initialLocale: 'fr',
});

export function updateLocale(userLanguage?: string) {
  if (typeof window !== 'undefined') {
    const browserLanguage = getLocaleFromNavigator();
    const newLocale = userLanguage || (browserLanguage?.startsWith('fr') ? 'fr' : 'en');
    locale.set(newLocale);
  }
}

export { _, locale, locales } from 'svelte-i18n';
