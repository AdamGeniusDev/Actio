export interface User {
  id:         string;
  email:      string;
  name:       string;
  firstName:  string;
  phone?:     string | null;
  avatarUrl?: string;
  isPro:      boolean;
  hasEverSubscribed:  boolean;
  createdAt:  string;
}

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
  expiresAt:    number;
}
