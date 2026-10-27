/**
 * AhorraTech - Root Layout
 * Proveedor de Safe Area, inicialización de hooks IoT de telemetría y notificaciones locales.
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useIoTData } from '../src/hooks/useIoTData';
import { useNotifications } from '../src/hooks/useNotifications';
import { useEnergyStore } from '../src/store/useEnergyStore';
import { colors } from '../src/theme/colors';

// Componente interno para montar los hooks globales dentro del árbol de React
function GlobalEngine() {
  const seedInitialDataIfEmpty = useEnergyStore((s) => s.seedInitialDataIfEmpty);

  // Inicializar servicio IoT (Polling ESP32 / Simulación)
  useIoTData();

  // Inicializar alertas y canales de notificación Android
  useNotifications();

  useEffect(() => {
    seedInitialDataIfEmpty();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <GlobalEngine />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.base },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
