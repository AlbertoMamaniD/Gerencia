/**
 * Proveedor de tema: resuelve la preferencia del usuario (sistema / claro / oscuro)
 * y expone el tema activo mediante `useTheme()`.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { ImageStyle, StyleSheet, TextStyle, useColorScheme, ViewStyle } from 'react-native';
import { darkTheme, lightTheme, Theme } from './themes';

export type ThemePreference = 'system' | 'light' | 'dark';

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

const ThemeContext = createContext<Theme>(lightTheme);

export function resolveTheme(preference: ThemePreference, systemScheme: string | null | undefined): Theme {
  if (preference === 'light') return lightTheme;
  if (preference === 'dark') return darkTheme;
  return systemScheme === 'dark' ? darkTheme : lightTheme;
}

interface ThemeProviderProps {
  preference: ThemePreference;
  children: React.ReactNode;
}

export function ThemeProvider({ preference, children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const theme = useMemo(() => resolveTheme(preference, systemScheme), [preference, systemScheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * Crea un hook de estilos dependiente del tema, con caché por tema
 * (los StyleSheet se generan una sola vez por modo de color).
 */
export function makeStyles<T extends NamedStyles>(factory: (theme: Theme) => T & NamedStyles) {
  const cache = new WeakMap<Theme, T>();
  return function useStyles(): T {
    const theme = useTheme();
    let styles = cache.get(theme);
    if (!styles) {
      styles = StyleSheet.create(factory(theme));
      cache.set(theme, styles);
    }
    return styles;
  };
}
