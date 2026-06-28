export interface User {
  id:         string;
  email:      string;
  name:       string;
  firstName:  string;
  phone?:     string | null;
  avatarUrl?: string;
  isPro:      boolean;
  hasEverSubscribed:  boolean;
  currentPeriodEnd?:  string | null;
  createdAt:  string;
}

// Réponse brute de better-auth (cf. backend/src/drizzle/schema.ts table
// "user") — forme différente de notre `User` applicatif : pas de
// firstName/isPro/hasEverSubscribed, juste ce que better-auth gère lui-même.
// `toAppUser()` (lib/api/authApi.ts) fait la conversion.
export interface BetterAuthUser {
  id:            string;
  email:         string;
  name:          string;
  image?:        string | null;
  emailVerified: boolean;
  createdAt:     string;
}
