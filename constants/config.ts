export const CONFIG = {
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.actio.app',
    timeout: 10_000,
  },
  support: {
    // TODO: remplacer par une adresse pro avant publication (domaine actio.app)
    email: 'supportactio@gmail.com',
  },
  auth: {
    tokenRefreshBuffer: 5 * 60 * 1000,
  },
  alarm: {
    maxSnoozeCount: 3,
    snoozeMinutes:  5,
  },
  tasks: {
    maxTitleLength: 120,
    maxDescLength:  500,
  },
  pagination: { defaultLimit: 20 },
  features:   { biometrics: true, garantNotifs: true, weekPlanning: true },
} as const;
