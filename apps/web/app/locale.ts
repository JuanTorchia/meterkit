export const locales = ["en", "es", "pt-BR"] as const;

export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
  "pt-BR": "Português (Brasil)",
};

export const dateLocales: Record<Locale, string> = {
  en: "en-US",
  es: "es-419",
  "pt-BR": "pt-BR",
};

export function isLocale(value: string | null): value is Locale {
  return locales.includes(value as Locale);
}
