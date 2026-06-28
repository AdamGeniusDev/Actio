import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '@/lib/secureStorage';
import type { User } from '@/types/user.types';

interface AuthState {
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  // Token de session better-auth (plugin bearer) — une seule chaîne
  // opaque, PAS un access+refresh token OAuth classique. better-auth n'a
  // pas de notion de refresh token : ce token est renouvelé tout seul par
  // le serveur sur chaque réponse authentifiée (cf. lib/api/client.ts qui
  // lit l'en-tête `set-auth-token`), et redevient invalide après ~7 jours
  // d'inactivité totale (Max-Age côté serveur) — dans ce cas, 401 partout
  // → déconnexion automatique, pas de tentative de "refresh".
  token: string | null;
  user: User | null;

  setOnboardingComplete: () => void;
  setAuthenticated: (token: string, user: User) => void;
  setToken: (token: string) => void;
  setProStatus: (isPro: boolean, currentPeriodEnd: string | null) => void;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      hasSeenOnboarding: false,
      token: null,
      user: null,

      setOnboardingComplete: () => set({ hasSeenOnboarding: true }),
      setAuthenticated: (token, user) => set({ isAuthenticated: true, token, user }),
      setToken: (token) => set({ token }),
      setProStatus: (isPro, currentPeriodEnd) => set((state) => ({
        user: state.user
          ? { ...state.user, isPro, hasEverSubscribed: state.user.hasEverSubscribed || isPro, currentPeriodEnd }
          : state.user,
      })),
      updateUser: (patch) => set((state) => ({
        user: state.user ? { ...state.user, ...patch } : state.user,
      })),
      logout: () => set({ isAuthenticated: false, token: null, user: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
