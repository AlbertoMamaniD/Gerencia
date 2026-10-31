/**
 * Libro del medidor: acumula el consumo real a partir de las lecturas del sensor,
 * mantiene la calibración por foto y el historial diario.
 *
 * Modelo:
 *   meterKWh       → lectura equivalente del medidor de la distribuidora.
 *   sensorKWh      → última lectura cruda de la fuente (PZEM o simulador).
 *   cycleStartKWh  → lectura del medidor al iniciar el ciclo de facturación.
 * Cada lectura nueva suma solo la diferencia respecto a la anterior, así un reinicio
 * del sensor, un cambio de fuente o una calibración no generan saltos de consumo.
 */

import { calculateCostBs, roundTo } from './billing';
import { DailyConsumption, DailyEnergyMap } from './types';

export interface MeterLedger {
  meterKWh: number;
  sensorKWh: number | null;
  cycleStartKWh: number;
  daily: DailyEnergyMap;
}

/** Diferencia máxima aceptada entre dos lecturas; por encima se considera un error del sensor. */
export const MAX_PLAUSIBLE_DELTA_KWH = 500;
/** Días de historial diario que se conservan. */
export const DAILY_RETENTION_DAYS = 35;

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Fecha local en formato YYYY-MM-DD (no UTC: evita que el día cambie a las 20:00 en Bolivia). */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function createLedger(initialMeterKWh = 0): MeterLedger {
  return { meterKWh: initialMeterKWh, sensorKWh: null, cycleStartKWh: initialMeterKWh, daily: {} };
}

export function getCycleEnergyKWh(ledger: MeterLedger): number {
  return roundTo(Math.max(0, ledger.meterKWh - ledger.cycleStartKWh), 3);
}

function pruneDaily(daily: DailyEnergyMap, now: Date): DailyEnergyMap {
  const oldestKey = toLocalDateKey(addDays(now, -(DAILY_RETENTION_DAYS - 1)));
  const result: DailyEnergyMap = {};
  for (const [key, value] of Object.entries(daily)) {
    if (key >= oldestKey) result[key] = value;
  }
  return result;
}

/**
 * Integra una nueva lectura acumulada del sensor.
 */
export function applySensorReading(ledger: MeterLedger, sensorKWh: number, at: Date): MeterLedger {
  if (!Number.isFinite(sensorKWh) || sensorKWh < 0) return ledger;

  if (ledger.sensorKWh === null) {
    return { ...ledger, sensorKWh };
  }

  const delta = sensorKWh - ledger.sensorKWh;
  // Contador reiniciado o salto imposible: se toma como nueva base sin sumar consumo.
  if (delta <= 0 || delta > MAX_PLAUSIBLE_DELTA_KWH) {
    return { ...ledger, sensorKWh };
  }

  const key = toLocalDateKey(at);
  const daily = pruneDaily({ ...ledger.daily, [key]: roundTo((ledger.daily[key] ?? 0) + delta, 4) }, at);

  return {
    ...ledger,
    sensorKWh,
    meterKWh: roundTo(ledger.meterKWh + delta, 4),
    daily,
  };
}

/**
 * Ajusta la lectura a la del medidor físico conservando el consumo ya medido del ciclo.
 */
export function calibrateLedger(ledger: MeterLedger, meterReadingKWh: number): MeterLedger {
  if (!Number.isFinite(meterReadingKWh) || meterReadingKWh < 0) return ledger;
  const diff = meterReadingKWh - ledger.meterKWh;
  return {
    ...ledger,
    meterKWh: roundTo(meterReadingKWh, 4),
    cycleStartKWh: roundTo(ledger.cycleStartKWh + diff, 4),
  };
}

export function resetLedgerCycle(ledger: MeterLedger): MeterLedger {
  return { ...ledger, cycleStartKWh: ledger.meterKWh };
}

/** Se usa al cambiar de fuente: la próxima lectura se toma como nueva base. */
export function detachSensor(ledger: MeterLedger): MeterLedger {
  return { ...ledger, sensorKWh: null };
}

/** Serie de los últimos 7 días (incluye hoy) para el gráfico semanal. */
export function buildWeeklySeries(daily: DailyEnergyMap, ratePerKWh: number, today: Date = new Date()): DailyConsumption[] {
  const series: DailyConsumption[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const date = addDays(today, -offset);
    const key = toLocalDateKey(date);
    const energyKWh = roundTo(daily[key] ?? 0, 2);
    series.push({
      date: key,
      dayLabel: offset === 0 ? 'Hoy' : DAY_LABELS[date.getDay()],
      energyKWh,
      costBs: calculateCostBs(energyKWh, ratePerKWh),
      isToday: offset === 0,
    });
  }
  return series;
}

/**
 * Historial de ejemplo para el modo simulación en la primera ejecución
 * (6 días previos, sin incluir hoy). Determinista para que sea reproducible.
 */
export function createDemoDaily(today: Date = new Date()): DailyEnergyMap {
  const daily: DailyEnergyMap = {};
  for (let offset = 6; offset >= 1; offset--) {
    const key = toLocalDateKey(addDays(today, -offset));
    daily[key] = roundTo(5.2 + Math.sin(offset * 1.3) * 1.6, 2);
  }
  return daily;
}
