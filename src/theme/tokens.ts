/**
 * Tokens de diseño independientes del modo de color:
 * espaciado (escala de 4 pt), radios, tipografía y tamaños táctiles.
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Ancho (dp) por debajo del cual se usa el diseño compacto (teléfonos de 320–359 dp). */
export const compactBreakpoint = 360;

/** Área táctil mínima recomendada (Material: 48 dp, Apple: 44 pt). */
export const touchTarget = 48;

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'title'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'caption'
  | 'overline'
  | 'metric';

interface TypeStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: 'uppercase';
}

/** Escala tipográfica mobile-first (Inter). */
export const typography: Record<TextVariant, TypeStyle> = {
  display: { fontFamily: fontFamily.bold, fontSize: 36, lineHeight: 42, letterSpacing: -1 },
  h1: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  h2: { fontFamily: fontFamily.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  title: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
  overline: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metric: { fontFamily: fontFamily.semibold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
};

/** Límite de escalado de fuente del sistema para no romper layouts (WCAG 1.4.4 permite 200%). */
export const maxFontScale = 1.6;
