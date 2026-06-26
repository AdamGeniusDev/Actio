import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try   { return await SecureStore.getItemAsync(key); }
    catch { return null; }
  },
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async delete(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },

  // Aliases requis par Zustand persist
  getItem(key: string)              { return this.get(key); },
  setItem(key: string, value: string) { return this.set(key, value); },
  removeItem(key: string)           { return this.delete(key); },
};

export const TOKEN_KEYS = {
  ACCESS:     'actio_access_token',
  REFRESH:    'actio_refresh_token',
  EXPIRES_AT: 'actio_token_expires_at',
} as const;