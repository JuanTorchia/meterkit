import { defineI18n } from "fumadocs-core/i18n";

export const i18n = defineI18n({
  defaultLanguage: "en",
  languages: ["en", "es"],
  parser: "dir",
});

export function isDocumentationLocale(value: string): value is "en" | "es" {
  return value === "en" || value === "es";
}
