import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { CONFIG } from '@/constants/config';
import { useAuthStore } from '@/stores/auth.store';

// Forme uniforme côté UI, quelle que soit l'origine (réseau, timeout, backend).
export class ApiError extends Error {
  readonly status: number;
  readonly errors?: string[];

  constructor(message: string, status: number, errors?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export const apiClient = axios.create({
  baseURL: CONFIG.api.baseUrl,
  timeout: CONFIG.api.timeout,
  headers: { 'content-type': 'application/json' },
});

// Relit le store à chaque requête plutôt qu'un état caché par un composant.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // Le plugin bearer de better-auth renvoie un token renouvelé sur
    // chaque réponse authentifiée, pas seulement au login.
    const renewedToken = response.headers['set-auth-token'];
    if (renewedToken && typeof renewedToken === 'string') {
      useAuthStore.getState().setToken(renewedToken);
    }
    return response;
  },
  (error: AxiosError<{ message?: string; status?: number; errors?: string[] }>) => {
    if (!error.response) {
      return Promise.reject(new ApiError(
        error.code === 'ECONNABORTED'
          ? 'La requête a expiré, vérifie ta connexion.'
          : 'Impossible de contacter le serveur, vérifie ta connexion.',
        0,
      ));
    }

    const { status, data } = error.response;

    // Déconnexion globale ici ; la navigation réagit à isAuthenticated ailleurs.
    if (status === 401) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(new ApiError(
      data?.message ?? 'Une erreur est survenue.',
      status,
      data?.errors,
    ));
  },
);
