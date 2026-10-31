import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemePreference, ThemeProvider } from '@/theme';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** Renderiza con los proveedores de la app (tema + zona segura). */
export function renderWithProviders(ui: React.ReactElement, preference: ThemePreference = 'light') {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider preference={preference}>{ui}</ThemeProvider>
    </SafeAreaProvider>
  );
}
