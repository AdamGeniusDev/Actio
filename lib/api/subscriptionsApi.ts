import { apiClient } from '@/lib/api/client';

export interface SubscriptionStatus {
  isPro: boolean;
  currentPeriodEnd: string | null;
}

// Miroir exact de backend/src/routes/subscriptions/subscriptions.routes.ts —
// le serveur choisit Moneroo ou LemonSqueezy selon countryCode (cf.
// backend/src/lib/region.ts), jamais ce client. Aucun montant n'est envoyé
// ici : le prix est fixé côté serveur par le provider/variant choisi.
export const subscriptionsApi = {
  async createCheckout(params: {
    returnUrl: string;
    countryCode?: string;
    billingPeriod: 'monthly' | 'yearly';
  }): Promise<{ checkoutUrl: string }> {
    const { data } = await apiClient.post<{ checkoutUrl: string }>('/api/subscriptions/checkout', params);
    return data;
  },

  async getStatus(): Promise<SubscriptionStatus> {
    const { data } = await apiClient.get<SubscriptionStatus>('/api/subscriptions/status');
    return data;
  },
};
