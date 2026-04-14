import en from '../locales/en.json';
import fr from '../locales/fr.json';

const translations: Record<string, any> = {
  en,
  fr
};

export function useTranslation() {
  const t = (key: string) => {
    // Determine language, default to 'en' or read from navigator
    const lang = navigator.language.startsWith('fr') ? 'fr' : 'en';
    return translations[lang][key] || key;
  };
  return { t };
}
