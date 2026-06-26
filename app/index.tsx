import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

export default function RootIndex() {
  const { isAuthenticated, hasSeenOnboarding } = useAuthStore();

  if (!hasSeenOnboarding) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // if (!isAuthenticated) {
  //   return <Redirect href="/(auth)/forgot-password" />;
  // }

  return <Redirect href="/(app)/(home)" />;
}
