/**
 * AhorraTech - Formatters Puros
 * Formateo estricto de moneda boliviana (Bs), unidades eléctricas (W, kW, V, A, kWh) y fechas.
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea monto monetario en Bolivianos (ej: "Bs 145,50")
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return 'Bs 0,00';
  const parts = amount.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decPart = parts[1];
  return `Bs ${intPart},${decPart}`;
}

/**
 * Formatea potencia eléctrica activa (ej: "1.25 kW" o "450 W")
 */
export function formatPower(watts: number): string {
  if (isNaN(watts) || watts < 0) return '0 W';
  if (watts >= 1000) {
    return `${(watts / 1000).toFixed(2)} kW`;
  }
  return `${Math.round(watts)} W`;
}

/**
 * Formatea energía eléctrica acumulada (ej: "124.50 kWh")
 */
export function formatEnergy(kWh: number): string {
  if (isNaN(kWh) || kWh < 0) return '0.00 kWh';
  return `${kWh.toFixed(2)} kWh`;
}

/**
 * Formatea corriente en Amperios (ej: "4.85 A")
 */
export function formatCurrent(amperes: number): string {
  if (isNaN(amperes) || amperes < 0) return '0.00 A';
  return `${amperes.toFixed(2)} A`;
}

/**
 * Formatea tensión en Voltios (ej: "220 V")
 */
export function formatVoltage(volts: number): string {
  if (isNaN(volts) || volts < 0) return '0 V';
  return `${Math.round(volts)} V`;
}

/**
 * Formatea factor de potencia (ej: "0.98 PF")
 */
export function formatPowerFactor(pf: number): string {
  if (isNaN(pf)) return '1.00';
  const clamped = Math.min(1, Math.max(0, pf));
  return clamped.toFixed(2);
}

/**
 * Formatea frecuencia de red (ej: "50.0 Hz")
 */
export function formatFrequency(hz: number): string {
  if (isNaN(hz) || hz < 0) return '50.0 Hz';
  return `${hz.toFixed(1)} Hz`;
}

/**
 * Formatea porcentaje (ej: "78.4%")
 */
export function formatPercentage(pct: number): string {
  if (isNaN(pct) || pct < 0) return '0.0%';
  return `${pct.toFixed(1)}%`;
}

/**
 * Formatea hora para telemetría en tiempo real (ej: "14:25:02")
 */
export function formatTime(timestamp: number): string {
  try {
    return format(new Date(timestamp), 'HH:mm:ss');
  } catch {
    return '--:--:--';
  }
}

/**
 * Formatea hora corta para ejes de gráficos (ej: "14:25")
 */
export function formatShortTime(timestamp: number): string {
  try {
    return format(new Date(timestamp), 'HH:mm');
  } catch {
    return '--:--';
  }
}

/**
 * Formatea fecha legible en español (ej: "27 de octubre")
 */
export function formatSpanishDate(timestamp: number | Date): string {
  try {
    return format(timestamp, "d 'de' MMMM", { locale: es });
  } catch {
    return '';
  }
}
