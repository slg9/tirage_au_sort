import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

export const locales = ["fr", "en"] as const;
export const defaultLocale = "fr";

export type Locale = (typeof locales)[number];

const dictionaries = { fr, en } as const;

export function isLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export function t(key: string, locale: Locale): string {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, dictionaries[locale]);

  return typeof value === "string" ? value : key;
}

export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  return process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://wheeldraw.site";
}
