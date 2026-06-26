import { secureStorage, TOKEN_KEYS } from '@/lib/secureStorage';
import { CONFIG } from '@/constants/config';
import type { AuthTokens } from '@/types/user.types';

export const tokenManager = {
  save: async (t: AuthTokens) => {
    await secureStorage.set(TOKEN_KEYS.ACCESS,     t.accessToken);
    await secureStorage.set(TOKEN_KEYS.REFRESH,    t.refreshToken);
    await secureStorage.set(TOKEN_KEYS.EXPIRES_AT, String(t.expiresAt));
  },
  getAccessToken:  () => secureStorage.get(TOKEN_KEYS.ACCESS),
  getRefreshToken: () => secureStorage.get(TOKEN_KEYS.REFRESH),
  isExpiringSoon: async () => {
    const e = await secureStorage.get(TOKEN_KEYS.EXPIRES_AT);
    return !e || Date.now() + CONFIG.auth.tokenRefreshBuffer > Number(e);
  },
  clear: async () => {
    await secureStorage.delete(TOKEN_KEYS.ACCESS);
    await secureStorage.delete(TOKEN_KEYS.REFRESH);
    await secureStorage.delete(TOKEN_KEYS.EXPIRES_AT);
  },
};
