import { addMessages, getLocaleFromNavigator, init, locale } from "svelte-i18n";
import en from "./locales/en";
import fr from "./locales/fr";
import ru from "./locales/ru";
import hi from "./locales/hi";
import ca from "./locales/ca";

addMessages("en", en);
addMessages("fr", fr);
addMessages("ru", ru);
addMessages("hi", hi);
addMessages("ca", ca);

// Initialisation par défaut pour le SSR
init({
  fallbackLocale: "en",
  initialLocale: "fr",
});

export function updateLocale(userLanguage?: string) {
  if (typeof window !== "undefined") {
    const browserLanguage = getLocaleFromNavigator();
    let newLocale = "en";

    if (userLanguage) {
      newLocale = userLanguage;
    } else if (browserLanguage?.startsWith("fr")) {
      newLocale = "fr";
    } else if (browserLanguage?.startsWith("ru")) {
      newLocale = "ru";
    } else if (browserLanguage?.startsWith("hi")) {
      newLocale = "hi";
    } else if (browserLanguage?.startsWith("ca")) {
      newLocale = "ca";
    }

    locale.set(newLocale);
  }
}

export { _, locale, locales } from "svelte-i18n";
