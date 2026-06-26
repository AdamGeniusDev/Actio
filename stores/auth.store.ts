import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '@/lib/secureStorage';
import type { User } from '@/types/user.types';

interface AuthState {
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  token: string | null;
  user: User | null;

  setOnboardingComplete: () => void;
  setAuthenticated: (token: string, user: User) => void;
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
      logout: () => set({ isAuthenticated: false, token: null, user: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);