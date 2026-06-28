import '@/lib/i18n';
import { useEffect } from 'react';
import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PortalHost } from '@rn-primitives/portal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import '@/global.css';
import { NAV_THEME } from '@/constants/theme';
import { queryClient } from '@/lib/queryClient';
import { ToastHost } from '@/components/ui/Toast';
import { AlarmOverlay } from '@/components/alarm/AlarmOverlay';
import { SessionGate } from '@/components/auth/SessionGate';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { KeyboardProvider } from 'react-native-keyboard-controller';

// Appelé au niveau module — garde le splash visible pendant le chargement
SplashScreen.preventAutoHideAsync();

// ▶ expo-notifications — module natif, nécessite un build development.
// Décommenter ce bloc + l'appel à useAlarmNotificationListener() dans
// RootLayout une fois rebuildé : capte le tap sur la notification d'alarme
// (programmée par lib/notifications.ts) et réveille l'AlarmOverlay avec la
// bonne tâche, même si l'app était fermée.
//
// import * as Notifications from 'expo-notifications';
// import { useAlarmStore } from '@/stores/alarm.store';
//
// function useAlarmNotificationListener() {
//   useEffect(() => {
//     const sub = Notifications.addNotificationResponseReceivedListener((response) => {
//       const data = response.notification.request.content.data as { taskId?: string; type?: string };
//       if (data?.type === 'alarm' && data.taskId) {
//         useAlarmStore.getState().ring(data.taskId);
//       }
//     });
//     return () => sub.remove();
//   }, []);
// }

export default function RootLayout() {
  // useAlarmNotificationListener(); // ▶ décommenter avec le bloc ci-dessus une fois rebuildé
  const [loaded, error] = useFonts({
    'ClashDisplay-Bold':     require('../assets/fonts/ClashDisplay-Bold.otf'),
    'SpaceGrotesk-Bold':     require('../assets/fonts/SpaceGrotesk-Bold.ttf'),
    'SpaceGrotesk-Medium':   require('../assets/fonts/SpaceGrotesk-Medium.ttf'),
    'SpaceGrotesk-Regular':  require('../assets/fonts/SpaceGrotesk-Regular.ttf'),
    'Inter-Regular':         require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium':          require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold':        require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold':            require('../assets/fonts/Inter-Bold.ttf'),
    'Inter-Light':           require('../assets/fonts/Inter-Light.ttf'),
    'Inter-Thin':            require('../assets/fonts/Inter-Thin.ttf'),
    'Inter-ExtraLight':      require('../assets/fonts/Inter-ExtraLight.ttf'),
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // Garde le splash screen tant que les polices ne sont pas prêtes
  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* statusBarTranslucent / navigationBarTranslucent / preserveEdgeToEdge :
          forcés explicitement car l'auto-détection de react-native-edge-to-edge
          par KeyboardProvider est connue pour échouer sur certains appareils
          Android (cf. issues #1181 / #615 du repo keyboard-controller), ce qui
          désactive le edge-to-edge et fait réapparaître des barres système
          opaques en plus de casser le calcul de hauteur du clavier. */}
      <KeyboardProvider
        statusBarTranslucent
        navigationBarTranslucent
        preserveEdgeToEdge
      >
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <ThemeProvider value={NAV_THEME.dark}>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false ,contentStyle: { backgroundColor: '#080D14' } }} />
                <SessionGate />
                <AlarmOverlay />
                <ToastHost />
                <PortalHost />
              </ThemeProvider>
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}