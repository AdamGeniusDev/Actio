import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';
import 'dayjs/locale/en';

import i18next from '@/lib/i18n';
import { useLocalePrefsStore } from '@/stores/localePrefs.store';

dayjs.extend(relativeTime);
dayjs.locale(i18next.language);
// Garde dayjs synchronisé avec la langue choisie dans Réglages > Langue & Région
// (noms de jours/mois localisés dans formatDisplay/fromNow).
i18next.on('languageChanged', (lng) => dayjs.locale(lng));

export const dateUtils = {
  isToday:       (d: string) => dayjs(d).isSame(dayjs(), 'day'),
  isThisWeek:    (d: string) => dayjs(d).isSame(dayjs(), 'week'),
  formatDisplay: (d: string) => dayjs(d).format('dddd D MMMM'),
  formatTime:    (d: string) => dayjs(d).format(
    useLocalePrefsStore.getState().timeFormat === '24h' ? 'HH:mm' : 'h:mm A'
  ),
  fromNow:       (d: string) => dayjs(d).fromNow(),
  toISO:         (d: Date)   => dayjs(d).toISOString(),
};

/**
 * Utilitaires génériques de manipulation de dates.
 * Aucune dépendance à un type métier — réutilisable partout dans l'app.
 */

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function addWeeks(date: Date, n: number): Date {
  return addDays(date, n * 7);
}

export function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** Clé stable 'YYYY-MM-DD' utilisée pour grouper/indexer par jour. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}