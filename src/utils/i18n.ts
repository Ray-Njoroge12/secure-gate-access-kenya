import en from "@/locales/en";
import ki from "@/locales/ki";

const translations: Record<string, Record<string, string>> = {
  en,
  sw: ki,
};

export function t(key: string, lang: string = "en"): string {
  if (translations[lang] && translations[lang][key]) return translations[lang][key];
  if (translations["en"][key]) return translations["en"][key];
  return key;
}