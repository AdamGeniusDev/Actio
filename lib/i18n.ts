import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import frCommon      from '@/locales/fr/common.json';
import frOnboarding  from '@/locales/fr/onboarding.json';
import frAuth        from '@/locales/fr/auth.json';
import frHome        from '@/locales/fr/home.json';
import frFilters     from '@/locales/fr/filters.json';
import frTask        from '@/locales/fr/task.json';
import frPlanning     from '@/locales/fr/planning.json';
import frStats        from '@/locales/fr/stats.json';
import frSettings     from '@/locales/fr/settings.json';
import frProfile      from '@/locales/fr/profile.json';
import frPro          from '@/locales/fr/pro.json';
import frNotifications from '@/locales/fr/notifications.json';
import frGarants       from '@/locales/fr/garants.json'

import enCommon      from '@/locales/en/common.json';
import enOnboarding  from '@/locales/en/onboarding.json';
import enAuth        from '@/locales/en/auth.json';
import enHome        from '@/locales/en/home.json';
import enFilters     from '@/locales/en/filters.json';
import enTask        from '@/locales/en/task.json';
import enPlanning     from '@/locales/en/planning.json';
import enStats        from '@/locales/en/stats.json';
import enSettings     from '@/locales/en/settings.json';
import enProfile      from '@/locales/en/profile.json';
import enPro          from '@/locales/en/pro.json';
import enNotifications from '@/locales/en/notifications.json';
import enGarants       from '@/locales/en/garants.json'

// ── Langues supportées ────────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_META: Record<SupportedLanguage, { nativeName: string; region: string; flag: string }> = {
  fr: { nativeName: 'Français', region: 'France',         flag: '🇫🇷' },
  en: { nativeName: 'English',  region: 'United States',  flag: '🇺🇸' },
};

const LANG_KEY = '@actio/language';

// ── Couche storage ────────────────────────────────────────────────────────────
//
// ▶ MMKV — activer en prod (rebuild natif requis)
//
// import { MMKV } from 'react-native-mmkv';
// const _mmkv = new MMKV({ id: 'actio' });
// const storageLangGet = (_key: string): string | null =>
//   _mmkv.getString(_key) ?? null;
// const storageLangSet = (_key: string, _val: string): void =>
//   _mmkv.set(_key, _val);
//
// ▶ AsyncStorage — actif pour l'instant (Expo Go / dev sans rebuild)

import AsyncStorage from '@react-native-async-storage/async-storage';
const storageLangGet = (key: string): Promise<string | null> =>
  AsyncStorage.getItem(key);
const storageLangSet = (key: string, val: string): Promise<void> =>
  AsyncStorage.setItem(key, val).then(() => {});

// ── Language detector ─────────────────────────────────────────────────────────

const LanguageDetector = {
  type: 'languageDetector' as const,
  async: true,

  detect: async (callback: (lang: string) => void) => {
    try {
      const saved = await storageLangGet(LANG_KEY);
      if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)) {
        callback(saved);
        return;
      }
    } catch {}

    const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'fr';
    callback(
      SUPPORTED_LANGUAGES.includes(deviceLocale as SupportedLanguage)
        ? deviceLocale
        : 'fr',
    );
  },

  cacheUserLanguage: async (lang: string) => {
    try {
      await storageLangSet(LANG_KEY, lang);
    } catch {}
  },
};

// ── Init i18next ──────────────────────────────────────────────────────────────

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr',
    ns: ['common', 'onboarding', 'auth', 'home', 'filters', 'task', 'planning', 'stats', 'settings', 'profile','pro','notifications','garants'],
    defaultNS: 'common',
    resources: {
      fr: {
        common:     frCommon,
        onboarding: frOnboarding,
        planning:   frPlanning,
        auth:       frAuth,
        home:       frHome,       // { "greeting": "Bonjour..." }  ← pas de wrapper
        filters:    frFilters,    // { "all": "Tout", ... }
        task:       frTask,       // { "call_now": "Appeler..." }
        stats:      frStats,      // { "header": { "title": "Ma productivité" } }
        settings:   frSettings,   // { "header": { "title": "Paramètres" } }
        profile:    frProfile,    // { "header": { "title": "Profil" } }
        pro:        frPro,
        notifications: frNotifications,
        garants: frGarants
      },
      en: {
        common:     enCommon,
        onboarding: enOnboarding,
        planning:   enPlanning,
        auth:       enAuth,
        home:       enHome,
        filters:    enFilters,
        task:       enTask,
        stats:      enStats,
        settings:   enSettings,
        profile:    enProfile,
        pro:        enPro,
        notifications: enNotifications,
        garants: enGarants
      },
    },
    interpolation: {
      escapeValue: false,
    },
    missingKeyHandler: __DEV__
      ? (lng, ns, key) => console.warn(`[i18n] Missing key: ${ns}:${key} (${lng})`)
      : false,
  });

export default i18next;