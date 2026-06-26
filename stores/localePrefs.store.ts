import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TimeFormat = '24h' | '12h';

interface LocalePrefsState {
  timeFormat:    TimeFormat;
  setTimeFormat: (v: TimeFormat) => void;
}

export const useLocalePrefsStore = create<LocalePrefsState>()(
  persist(
    (set) => ({
      timeFormat: '24h',
      setTimeFormat: (v) => set({ timeFormat: v }),
    }),
    {
      name:    'locale-prefs-storage',
      // ── Couche storage ──────────────────────────────────────────────────
      //
      // ▶ MMKV — activer en prod (rebuild natif requis)
      //
      // import { mmkvStorage } from '@/lib/mmkvStorage';
      // storage: createJSONStorage(() => mmkvStorage),
      //
      // ▶ AsyncStorage — actif pour l'instant (Expo Go / dev sans rebuild)
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
