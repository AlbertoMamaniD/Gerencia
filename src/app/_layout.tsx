/**
 * Layout raíz: fuentes, pantalla de carga, tema y servicios globales
 * (lectura de telemetría y notificaciones de alertas).
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { useAlertNotifications } from '@/hooks/useAlertNotifications';
import { useTelemetryPolling } from '@/hooks/useTelemetryPolling';
import { configureNotifications } from '@/services/notifications';
import { useEnergyStore } from '@/store/useEnergyStore';
import { ThemeProvider, useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export { ErrorBoundary } from '@/components/layout/ErrorBoundary';

function GlobalServices() {
  const { colors } = useTheme();
  useTelemetryPolling();
  useAlertNotifications();

  useEffect(() => {
    void configureNotifications(colors.primary);
  }, [colors.primary]);

  return null;
}

function ThemedStack() {
  const theme = useTheme();

  useEffect(() => {
    // Color de fondo nativo (evita destellos blancos en modo oscuro al navegar).
    void SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => undefined);
  }, [theme.colors.background]);

  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <GlobalServices />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const hasHydrated = useEnergyStore((s) => s.hasHydrated);
  const themePreference = useEnergyStore((s) => s.themePreference);
  // Si las fuentes fallan se usa la del sistema: la app nunca queda bloqueada.
  const ready = (fontsLoaded || !!fontError) && hasHydrated;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider preference={themePreference}>
        <ThemedStack />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
