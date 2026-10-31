/**
 * Formateo consistente en español (Bolivia): punto para miles y coma decimal.
 * Se implementa sin Intl para obtener el mismo resultado en Hermes (Android/iOS) y en pruebas.
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const NBSP = ' ';

export function formatNumber(value: number, decimals = 2): string {
  const safe = Number.isFinite(value) ? value : 0;
  const fixed = Math.abs(safe).toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  // Evita mostrar "-0,00".
  const sign = safe < 0 && Number(fixed) !== 0 ? '-' : '';
  return decPart ? `${sign}${grouped},${decPart}` : `${sign}${grouped}`;
}

/** "Bs 1.234,56" (con espacio no separable para que no se parta en dos líneas). */
export function formatCurrency(amount: number): string {
  return `Bs${NBSP}${formatNumber(amount, 2)}`;
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function formatEnergy(kWh: number, decimals = 2): string {
  return `${formatNumber(nonNegative(kWh), decimals)}${NBSP}kWh`;
}

export function formatPower(watts: number): string {
  const w = nonNegative(watts);
  if (w >= 1000) return `${formatNumber(w / 1000, 2)}${NBSP}kW`;
  return `${formatNumber(Math.round(w), 0)}${NBSP}W`;
}

export function formatVoltage(volts: number): string {
  return `${formatNumber(nonNegative(volts), 1)}${NBSP}V`;
}

export function formatCurrent(amperes: number): string {
  return `${formatNumber(nonNegative(amperes), 2)}${NBSP}A`;
}

export function formatFrequency(hz: number): string {
  return `${formatNumber(nonNegative(hz), 1)}${NBSP}Hz`;
}

export function formatPowerFactor(pf: number): string {
  return formatNumber(Math.min(1, nonNegative(pf)), 2);
}

export function formatPercentage(pct: number, decimals = 1): string {
  return `${formatNumber(nonNegative(pct), decimals)}%`;
}

function safeFormat(timestamp: number | Date, pattern: string, fallback: string): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return fallback;
  return format(date, pattern, { locale: es });
}

/** "14:25:02" */
export function formatTime(timestamp: number): string {
  return safeFormat(timestamp, 'HH:mm:ss', '--:--:--');
}

/** "14:25" */
export function formatShortTime(timestamp: number): string {
  return safeFormat(timestamp, 'HH:mm', '--:--');
}

/** "27 de octubre" */
export function formatLongDate(timestamp: number | Date): string {
  return safeFormat(timestamp, "d 'de' MMMM", '');
}

/** "27 oct · 14:25" */
export function formatDateTime(timestamp: number | Date): string {
  return safeFormat(timestamp, "d MMM '·' HH:mm", '');
}

/** "ahora", "hace 5 s", "hace 3 min", "hace 2 h" o la fecha si es más antiguo. */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diffSeconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (diffSeconds < 5) return 'ahora';
  if (diffSeconds < 60) return `hace ${diffSeconds} s`;
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return formatDateTime(timestamp);
}

/** Valor numérico para precargar un campo de texto: 0.85 → "0,85". */
export function toInputValue(value: number, maxDecimals = 2): string {
  if (!Number.isFinite(value)) return '';
  return String(Number(value.toFixed(maxDecimals))).replace('.', ',');
}
