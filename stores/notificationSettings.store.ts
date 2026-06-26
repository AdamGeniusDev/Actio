import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Sons d'alarme bundlés ────────────────────────────────────────────────────
// 3 sons fournis avec l'app — voir assets/sounds/ pour les fichiers attendus.

export type AlarmSoundId = string; // 'classic' | 'soft' | 'digital', ou l'URI d'un son ajouté

export const PRESET_SOUND_IDS = ['classic', 'soft', 'digital'] as const;
export type PresetSoundId = typeof PRESET_SOUND_IDS[number];

export const DEFAULT_ALARM_SOUND: AlarmSoundId = 'classic';

// Son ajouté par l'utilisateur depuis ses fichiers — on garde le nom réel du
// fichier (fourni par le picker) pour l'afficher, au lieu d'un libellé générique.
export interface CustomSound {
  uri:  string;
  name: string;
}

// ─── Settings persistés ───────────────────────────────────────────────────────

export interface NotifSettings {
  // Rappels
  multipleReminders:    boolean;
  silenceEnabled:       boolean;
  alarmSoundId:         AlarmSoundId;
  customSounds:         CustomSound[]; // ajoutés via le picker de fichiers, persistés
  // Notifications système
  lateTasks:            boolean;
  aiTips:               boolean;
  weeklyReport:         boolean;
  streaks:              boolean;
  garantAlertImmediate: boolean;
  // Avancé
  vibrationEnabled:     boolean;
  vibrationIntensity:   number; // 0–1
  persistentAlarm:      boolean;
  lockScreenOverride:   boolean;
  directAction:         boolean;
}

interface NotificationSettingsState extends NotifSettings {
  set: <K extends keyof NotifSettings>(key: K, value: NotifSettings[K]) => void;
}

const DEFAULTS: NotifSettings = {
  multipleReminders:    false,
  silenceEnabled:       true,
  alarmSoundId:         DEFAULT_ALARM_SOUND,
  customSounds:         [],
  lateTasks:            true,
  aiTips:               false,
  weeklyReport:         true,
  streaks:              true,
  garantAlertImmediate: true,
  vibrationEnabled:     true,
  vibrationIntensity:   0.75,
  persistentAlarm:      true,
  lockScreenOverride:   true,
  directAction:         true,
};

export const useNotificationSettingsStore = create<NotificationSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (key, value) => set((state) => ({ ...state, [key]: value })),
    }),
    {
      name:    'actio-notification-settings',
      // ── Couche storage ──────────────────────────────────────────────────
      //
      // ▶ MMKV — activer en prod (rebuild natif requis)
      //
      // import { mmkvStorage } from '@/lib/mmkvStorage';
      // storage: createJSONStorage(() => mmkvStorage),
      //
      // ▶ AsyncStorage — actif pour l'instant (Expo Go / dev sans rebuild)
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // v0 → v1 : customSounds est passé de string[] (URI seule) à
      // CustomSound[] (URI + nom réel du fichier) — on convertit les anciennes
      // entrées plutôt que de les perdre.
      migrate: (persisted) => {
        const state = persisted as NotifSettings;
        if (Array.isArray(state?.customSounds) && typeof state.customSounds[0] === 'string') {
          state.customSounds = (state.customSounds as unknown as string[]).map((uri) => ({
            uri,
            name: 'Son personnalisé',
          }));
        }
        return state;
      },
      // On ne persiste que les données, jamais la fonction `set`
      partialize: (state) => {
        const { set: _set, ...rest } = state;
        return rest;
      },
    },
  ),
);