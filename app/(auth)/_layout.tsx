import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

// Un utilisateur déjà connecté ne doit jamais revoir login/register.
export default function Layout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(app)/(home)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
