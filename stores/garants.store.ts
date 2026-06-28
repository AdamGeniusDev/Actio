import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Relationship  = 'family' | 'friend' | 'colleague' | 'other';
export type GarantMode    = 'app' | 'direct';
export type InviteStatus  = 'pending' | 'accepted';

export const DELAY_OPTIONS = [5, 10, 15, 30, 60] as const;
export type DelayMinutes = typeof DELAY_OPTIONS[number];

export interface GarantChannels {
  email:    boolean;
  sms:      boolean;
  whatsapp: boolean;
}

export interface Garant {
  id:                 string;
  mode:               GarantMode;
  firstName:          string;
  lastName:           string;
  email?:             string;        // mode 'app' uniquement
  inviteStatus?:      InviteStatus;  // mode 'app' uniquement
  channels?:          GarantChannels; // mode 'direct' uniquement
  contact?:           string; // téléphone ou email réel pour les canaux actifs (lib/garantNotifications.ts)
  relationship:       Relationship;
  alertDelayMinutes:  DelayMinutes;
  isActive:           boolean; // surveille une tâche en cours actuellement
  photoUrl?:          string;
}

interface GarantsState {
  garants:      Garant[];
  addGarant:    (g: Omit<Garant, 'id' | 'isActive'>) => void;
  updateGarant: (id: string, patch: Partial<Garant>) => void;
  removeGarant: (id: string) => void;
  resendInvite: (id: string) => void;
}

const MOCK_GARANTS: Garant[] = [
  {
    id: '1', mode: 'direct', firstName: 'Marc', lastName: 'Lebrun',
    relationship: 'family', alertDelayMinutes: 15,
    channels: { email: true, sms: false, whatsapp: false },
    isActive: true,
  },
  {
    id: '2', mode: 'app', firstName: 'Salim', lastName: 'Asami',
    email: 'salim.asami@example.com', inviteStatus: 'accepted',
    relationship: 'friend', alertDelayMinutes: 30,
    isActive: true,
  },
  {
    id: '3', mode: 'direct', firstName: 'Sophie', lastName: 'Martin',
    relationship: 'friend', alertDelayMinutes: 15,
    channels: { email: true, sms: false, whatsapp: false },
    isActive: false,
  },
];

// 100% local par design — aucune table "garants" côté backend (cf.
// backend/ARCHITECTURE.md). Seule l'alerte programmée pour une tâche
// donnée est synchronisée (stores/tasks.store.ts), jamais la liste des Garants.
export const useGarantsStore = create<GarantsState>()(
  persist(
    (set) => ({
      garants: MOCK_GARANTS,

      addGarant: (g) => set((state) => ({
        garants: [...state.garants, { ...g, id: Date.now().toString(), isActive: false }],
      })),

      updateGarant: (id, patch) => set((state) => ({
        garants: state.garants.map((g) => (g.id === id ? { ...g, ...patch } : g)),
      })),

      removeGarant: (id) => set((state) => ({
        garants: state.garants.filter((g) => g.id !== id),
      })),

      resendInvite: (id) => set((state) => ({
        garants: state.garants.map((g) =>
          g.id === id && g.mode === 'app' ? { ...g, inviteStatus: 'pending' } : g
        ),
      })),
    }),
    {
      name: 'actio-garants',
      // MMKV en prod (rebuild natif requis) : storage: createJSONStorage(() => mmkvStorage)
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ garants: state.garants }),
    },
  ),
);
