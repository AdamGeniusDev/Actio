import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/queryKeys';
import { subscriptionsApi } from '@/lib/api/subscriptionsApi';
import { useAuthStore } from '@/stores/auth.store';

export function useCreateCheckoutMutation() {
  return useMutation({ mutationFn: subscriptionsApi.createCheckout });
}

// poll: true ré-interroge toutes les 2s tant que isPro est faux — le webhook
// du prestataire de paiement met à jour la base de façon asynchrone.
export function useSubscriptionStatusQuery(options?: { poll?: boolean }) {
  const setProStatus = useAuthStore((s) => s.setProStatus);
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: QUERY_KEYS.subscriptions.status,
    queryFn: async () => {
      const status = await subscriptionsApi.getStatus();
      setProStatus(status.isPro, status.currentPeriodEnd);
      return status;
    },
    refetchInterval: (query) => (options?.poll && !query.state.data?.isPro ? 2000 : false),
    initialData: () => queryClient.getQueryData(QUERY_KEYS.subscriptions.status),
  });
}
