import { addMessages, init, getLocaleFromNavigator, locale } from 'svelte-i18n';
import en from './locales/en';
import fr from './locales/fr';
import ru from './locales/ru';

addMessages('en', en);
addMessages('fr', fr);
addMessages('ru', ru);

// Initialisation par défaut pour le SSR
init({
  fallbackLocale: 'en',
  initialLocale: 'fr',
});

export function updateLocale(userLanguage?: string) {
  if (typeof window !== 'undefined') {
    const browserLanguage = getLocaleFromNavigator();
    let newLocale = 'en';
    
    if (userLanguage) {
      newLocale = userLanguage;
    } else if (browserLanguage?.startsWith('fr')) {
      newLocale = 'fr';
    } else if (browserLanguage?.startsWith('ru')) {
      newLocale = 'ru';
    }
    
    locale.set(newLocale);
  }
}

export { _, locale, locales } from 'svelte-i18n';
