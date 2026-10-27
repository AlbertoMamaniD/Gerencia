/**
 * AhorraTech - Modern Light Theme Design Tokens
 * Paleta corporativa de alto contraste, limpia y profesional (Modo Claro).
 * Cero tonos neón agresivos, máxima legibilidad y estética FinTech contemporánea.
 */

export const colors = {
  background: {
    base: '#F8FAFC',       // Fondo principal limpio Slate-50
    card: '#FFFFFF',       // Superficie de tarjetas blanco puro
    subtle: '#F1F5F9',     // Fondo suave Slate-100 para chips e inputs
    elevated: '#FFFFFF',   // Superficies elevadas
  },
  border: {
    subtle: '#E2E8F0',     // Borde suave Slate-200
    highlight: '#CBD5E1',  // Borde destacado Slate-300
    accent: '#2563EB',     // Azul real profesional (sin neón)
    warning: '#D97706',    // Ámbar sobrio
    danger: '#DC2626',     // Carmesí nítido
  },
  text: {
    primary: '#0F172A',    // Texto principal Slate-900 (máximo contraste)
    secondary: '#475569',  // Texto secundario Slate-600
    muted: '#64748B',      // Texto apagado Slate-500
    white: '#FFFFFF',
    dark: '#0F172A',
  },
  brand: {
    electricBlue: '#1D4ED8',      // Azul zafiro refinado
    electricBlueGlow: '#2563EB',
    telemetryCyan: '#0284C7',     // Azul océano profesional (adiós neón chillón)
    telemetryCyanGlow: '#0369A1',
  },
  status: {
    success: '#059669',
    successBg: 'rgba(5, 150, 105, 0.08)',
    warning: '#D97706',
    warningBg: 'rgba(217, 119, 6, 0.08)',
    danger: '#DC2626',
    dangerBg: 'rgba(220, 38, 38, 0.08)',
    info: '#2563EB',
    infoBg: 'rgba(37, 99, 235, 0.08)',
  },
  telemetry: {
    voltage: '#7C3AED',   // Violeta técnico
    current: '#D97706',   // Ámbar eléctrico
    amp: '#D97706',
    power: '#0284C7',     // Océano técnico
    frequency: '#059669', // Esmeralda
    hz: '#059669',
    powerFactor: '#DB2777', // Magenta sofisticado
    pf: '#DB2777',
    energy: '#2563EB',    // Azul real
  },
  chart: {
    lineStroke: '#2563EB',
    gradientStart: 'rgba(37, 99, 235, 0.22)',
    gradientEnd: 'rgba(37, 99, 235, 0.00)',
    barPrimary: '#2563EB',
    barWarning: '#D97706',
    barDanger: '#DC2626',
    gridLines: '#E2E8F0',
  },
} as const;

export type ColorsType = typeof colors;
