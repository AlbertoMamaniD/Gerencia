/**
 * AhorraTech - Smart Grid FinTech Design Tokens
 * Paleta de colores de alto contraste optimizada para telemetría IoT y finanzas.
 */

export const colors = {
  background: {
    base: '#070B14',
    card: '#0D1527',
    subtle: '#111C33',
    elevated: '#162544',
  },
  border: {
    subtle: '#1E2D4A',
    highlight: '#2E436B',
    accent: '#00F0FF',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
    muted: '#64748B',
    white: '#FFFFFF',
    dark: '#070B14',
  },
  brand: {
    electricBlue: '#0066FF',
    electricBlueGlow: '#3B82F6',
    telemetryCyan: '#00F0FF',
    telemetryCyanGlow: '#38BDF8',
  },
  status: {
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.12)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.12)',
    danger: '#EF4444',
    dangerBg: 'rgba(239, 68, 68, 0.12)',
    info: '#3B82F6',
    infoBg: 'rgba(59, 130, 246, 0.12)',
  },
  telemetry: {
    voltage: '#A855F7',   // Púrpura eléctrico
    current: '#F59E0B',   // Ámbar
    amp: '#F59E0B',
    power: '#00F0FF',     // Cyan
    frequency: '#10B981', // Verde esmeralda
    hz: '#10B981',
    powerFactor: '#EC4899', // Rosa neón
    pf: '#EC4899',
    energy: '#3B82F6',    // Azul zafiro
  },
  chart: {
    lineStroke: '#00F0FF',
    gradientStart: 'rgba(0, 240, 255, 0.45)',
    gradientEnd: 'rgba(0, 240, 255, 0.00)',
    barPrimary: '#0066FF',
    barWarning: '#F59E0B',
    barDanger: '#EF4444',
    gridLines: '#1E2D4A',
  },
} as const;

export type ColorsType = typeof colors;
