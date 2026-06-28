import { useEffect } from 'react';

import { useSessionQuery } from '@/hooks/api/useAuth';
import { useAuthStore } from '@/stores/auth.store';

// Monté une fois au démarrage (app/_layout.tsx) — confirme que la session
// persistée localement est encore valide côté serveur, sans attendre le
// prochain 401 sur une route métier.
export function SessionGate() {
  const { data, isError } = useSessionQuery();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (data === null || isError) {
      logout();
    }
  }, [data, isError, isAuthenticated, logout]);

  return null;
}
