import { dict, type Language } from "./dict";

export type { Language } from "./dict";
export const LANGUAGE_STORAGE_KEY = "calendar:lang";

export type Translations = (typeof dict)[Language];

export function getTranslations(lang: Language): Translations {
  return dict[lang];
}
