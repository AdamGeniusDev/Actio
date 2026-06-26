import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// Tableaux en JS pur — i18next ne supporte pas t('key.N') pour indexer un tableau JSON
const DAYS: Record<string, string[]> = {
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

const MONTHS: Record<string, string[]> = {
  fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/**
 * Retourne le label de date du jour formaté selon la locale active.
 * FR → "MARDI 14 JUIN 2026"
 * EN → "SUNDAY, JUNE 14, 2026"
 */
export function useTodayLabel(): string {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'fr';

  return useMemo(() => {
    const now       = new Date();
    const dayName   = DAYS[lang][now.getDay()];
    const monthName = MONTHS[lang][now.getMonth()];
    const dayNum    = now.getDate();
    const year      = now.getFullYear();

    if (lang === 'en') {
      return `${dayName.toUpperCase()}, ${monthName.toUpperCase()} ${dayNum}, ${year}`;
    }
    return `${dayName.toUpperCase()} ${dayNum} ${monthName.toUpperCase()} ${year}`;
  }, [lang]);
}