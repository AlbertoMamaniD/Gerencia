/**
 * Temas de color semánticos (claro / oscuro).
 * Identidad derivada del logotipo: azul marino profundo + cian eléctrico.
 * Todos los pares texto/fondo se validan contra WCAG AA en las pruebas (theme.test.ts).
 */

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;

  text: string;
  textSecondary: string;
  textMuted: string;

  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primarySoft: string;

  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  onDanger: string;

  /** Tarjeta principal (hero) siempre en azul marino de marca. */
  heroStart: string;
  heroEnd: string;
  heroText: string;
  heroMuted: string;
  heroAccent: string;
  heroTrack: string;
  heroSuccess: string;
  heroWarning: string;
  heroDanger: string;

  voltage: string;
  current: string;
  frequency: string;
  powerFactor: string;

  chartLine: string;
  chartGrid: string;
  overlay: string;
  tabBar: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
}

const brand = {
  navy950: '#061423',
  navy900: '#0B1F33',
  navy800: '#123150',
  cyan400: '#22D3EE',
  cyan700: '#0E7490',
  cyan800: '#155E75',
};

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#F3F6FA',
    surface: '#FFFFFF',
    surfaceMuted: '#EDF1F6',
    border: '#DFE5EE',
    borderStrong: '#C3CDDA',

    text: '#0B1B2B',
    textSecondary: '#43546A',
    textMuted: '#5D6D81',

    primary: brand.cyan700,
    primaryPressed: brand.cyan800,
    onPrimary: '#FFFFFF',
    primarySoft: '#E1F3F7',

    success: '#157A3E',
    successSoft: '#E5F5EB',
    warning: '#A9550A',
    warningSoft: '#FDF1E1',
    danger: '#C62828',
    dangerSoft: '#FCEBEB',
    onDanger: '#FFFFFF',

    heroStart: brand.navy900,
    heroEnd: brand.navy800,
    heroText: '#FFFFFF',
    heroMuted: '#A8BDD2',
    heroAccent: brand.cyan400,
    heroTrack: 'rgba(255,255,255,0.14)',
    heroSuccess: '#6EE7A0',
    heroWarning: '#FCD34D',
    heroDanger: '#FCA5A5',

    voltage: '#6D3FD6',
    current: '#B9480E',
    frequency: '#157A3E',
    powerFactor: '#B0275F',

    chartLine: brand.cyan700,
    chartGrid: '#E3E8EF',
    overlay: 'rgba(6,20,35,0.55)',
    tabBar: '#FFFFFF',
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: brand.navy950,
    surface: '#0D1E31',
    surfaceMuted: '#14283E',
    border: '#1E354E',
    borderStrong: '#2C4864',

    text: '#E9F0F7',
    textSecondary: '#B3C2D3',
    textMuted: '#93A5BA',

    primary: brand.cyan400,
    primaryPressed: '#67E3F5',
    onPrimary: '#04212B',
    primarySoft: 'rgba(34,211,238,0.14)',

    success: '#4ADE80',
    successSoft: 'rgba(74,222,128,0.14)',
    warning: '#FBBF24',
    warningSoft: 'rgba(251,191,36,0.14)',
    danger: '#F87171',
    dangerSoft: 'rgba(248,113,113,0.14)',
    onDanger: '#2A0606',

    heroStart: '#0F2B45',
    heroEnd: '#0B1F33',
    heroText: '#FFFFFF',
    heroMuted: '#A8BDD2',
    heroAccent: brand.cyan400,
    heroTrack: 'rgba(255,255,255,0.14)',
    heroSuccess: '#6EE7A0',
    heroWarning: '#FCD34D',
    heroDanger: '#FCA5A5',

    voltage: '#B69CFF',
    current: '#FDA15B',
    frequency: '#4ADE80',
    powerFactor: '#F78FBF',

    chartLine: brand.cyan400,
    chartGrid: '#1E354E',
    overlay: 'rgba(0,0,0,0.6)',
    tabBar: '#0B1A2A',
  },
};
