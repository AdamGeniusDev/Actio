import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/lib/api/authApi';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAuthStore } from '@/stores/auth.store';

export function useRegisterMutation() {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  return useMutation({
    mutationFn: authApi.signUpEmail,
    onSuccess: ({ token, user }) => setAuthenticated(token, user),
  });
}

export function useLoginMutation() {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  return useMutation({
    mutationFn: authApi.signInEmail,
    onSuccess: ({ token, user }) => setAuthenticated(token, user),
  });
}

export function useGoogleSignInMutation() {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  return useMutation({
    mutationFn: authApi.signInGoogle,
    onSuccess: ({ token, user }) => setAuthenticated(token, user),
  });
}

export function useLogoutMutation() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.signOut,
    // onSettled (pas onSuccess) : nettoie l'état local même si l'appel serveur échoue.
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
}

// Confirme la session auprès du serveur — un token local peut être expiré
// côté serveur sans qu'on le sache encore.
export function useSessionQuery() {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: QUERY_KEYS.auth.session,
    queryFn: authApi.getSession,
    enabled: !!token,
    staleTime: 0,
    retry: false,
  });
}
