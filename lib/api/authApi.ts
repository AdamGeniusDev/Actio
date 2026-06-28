import { apiClient } from '@/lib/api/client';
import type { BetterAuthUser, User } from '@/types/user.types';

interface BetterAuthSignInResponse {
  redirect: boolean;
  token: string;
  url?: string;
  user: BetterAuthUser;
}

interface GetSessionResponse {
  session: { id: string; expiresAt: string };
  user: BetterAuthUser;
}

// isPro/hasEverSubscribed ne viennent jamais de l'auth — posés par
// useSubscriptionStatusQuery (lib/api/subscriptionsApi.ts).
export function toAppUser(raw: BetterAuthUser): User {
  const [firstName] = raw.name.trim().split(/\s+/);
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    firstName: firstName || raw.name,
    avatarUrl: raw.image ?? undefined,
    isPro: false,
    hasEverSubscribed: false,
    currentPeriodEnd: null,
    createdAt: raw.createdAt,
  };
}

export const authApi = {
  async signUpEmail(params: { name: string; email: string; password: string }) {
    const { data } = await apiClient.post<BetterAuthSignInResponse>('/api/auth/sign-up/email', params);
    return { token: data.token, user: toAppUser(data.user) };
  },

  async signInEmail(params: { email: string; password: string }) {
    const { data } = await apiClient.post<BetterAuthSignInResponse>('/api/auth/sign-in/email', params);
    return { token: data.token, user: toAppUser(data.user) };
  },

  async signInGoogle(idToken: { token: string; accessToken?: string }) {
    const { data } = await apiClient.post<BetterAuthSignInResponse>('/api/auth/sign-in/social', {
      provider: 'google',
      idToken,
    });
    return { token: data.token, user: toAppUser(data.user) };
  },

  async getSession() {
    const { data } = await apiClient.get<GetSessionResponse | ''>('/api/auth/get-session');
    // better-auth renvoie "" (pas null/204) quand il n'y a pas de session.
    if (!data) return null;
    return { user: toAppUser(data.user) };
  },

  async signOut() {
    await apiClient.post('/api/auth/sign-out');
  },
};
