/**
 * Migración del estado guardado por versiones anteriores de la app (v1.0, sin versión),
 * para que los usuarios conserven su presupuesto, IP y calibraciones.
 */

import { AlertType, BudgetConfig, ConnectionConfig, MeterCaptureRecord } from '@/domain/types';
import { createDemoDaily, MeterLedger } from '@/domain/meter';
import { SIMULATION_START_KWH } from '@/services/telemetry/simulator';
import type { ThemePreference } from '@/theme/ThemeProvider';

export interface PersistedState {
  budget: BudgetConfig;
  connection: ConnectionConfig;
  ledger: MeterLedger;
  captures: MeterCaptureRecord[];
  themePreference: ThemePreference;
  /** El libro contiene datos de demostración del modo simulación. */
  hasDemoData: boolean;
  /** Fecha (YYYY-MM-DD) de inicio del ciclo vigente; al cambiar, el ciclo se reinicia solo. */
  cycleKey: string | null;
  /** Alertas que el usuario cerró (se recuerdan entre aperturas de la app). */
  dismissedAlertTypes: AlertType[];
  /** Última notificación enviada por tipo, para no repetirla en cada apertura. */
  alertNotifications: Partial<Record<AlertType, AlertNotificationRecord>>;
}

export interface AlertNotificationRecord {
  at: number;
  cycleKey: string | null;
}

export const STORE_VERSION = 4;
export const MAX_CAPTURES = 50;

export const DEFAULT_BUDGET: BudgetConfig = {
  ratePerKWh: 0.85,
  monthlyBudgetBs: 180,
  billingCycleStartDay: 1,
  warningThresholdPct: 80,
  maxPowerThresholdW: 3500,
};

export const DEFAULT_CONNECTION: ConnectionConfig = {
  mode: 'simulation',
  host: '192.168.4.1',
  pollingIntervalMs: 2000,
};

/** Libro de demostración: ~85 kWh consumidos en el ciclo y 6 días de historial. */
export function createDemoLedger(now: Date = new Date()): MeterLedger {
  return { meterKWh: SIMULATION_START_KWH, sensorKWh: null, cycleStartKWh: 0, daily: createDemoDaily(now) };
}

export function createInitialPersistedState(now: Date = new Date()): PersistedState {
  return {
    budget: DEFAULT_BUDGET,
    connection: DEFAULT_CONNECTION,
    ledger: createDemoLedger(now),
    captures: [],
    themePreference: 'system',
    hasDemoData: true,
    cycleKey: null,
    dismissedAlertTypes: [],
    alertNotifications: {},
  };
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function migrateLegacyCapture(raw: unknown): MeterCaptureRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const detectedKWh = num(c.detectedKWh, NaN);
  if (!Number.isFinite(detectedKWh)) return null;
  const imageUri = typeof c.imageUri === 'string' && c.imageUri ? c.imageUri : null;
  return {
    id: typeof c.id === 'string' ? c.id : `capture-${num(c.timestamp, Date.now())}`,
    imageUri,
    detectedKWh,
    costBs: num(c.costBs, 0),
    timestamp: num(c.timestamp, Date.now()),
    meterSerial: typeof c.meterSerial === 'string' ? c.meterSerial : null,
    confidence: typeof c.confidence === 'number' ? c.confidence : null,
    source: 'ocr',
    cloudSynced: imageUri?.startsWith('http') ?? false,
  };
}

/** Convierte el estado v1.0 (budgetConfig / connection.ipAddress / meterCaptures) al formato actual. */
export function migratePersistedState(persisted: unknown, version: number, now: Date = new Date()): PersistedState {
  const base = createInitialPersistedState(now);
  if (!persisted || typeof persisted !== 'object') return base;
  const old = persisted as Record<string, unknown>;

  // v3 tiene el mismo formato; v4 solo agrega campos con valores por defecto.
  if (version >= 3) {
    return { ...base, ...(old as Partial<PersistedState>) };
  }

  const oldBudget = (old.budgetConfig ?? {}) as Record<string, unknown>;
  const oldConnection = (old.connection ?? {}) as Record<string, unknown>;
  const mode = oldConnection.mode === 'hardware' ? 'hardware' : 'simulation';

  return {
    ...base,
    budget: {
      ratePerKWh: num(oldBudget.ratePerKWh, DEFAULT_BUDGET.ratePerKWh),
      monthlyBudgetBs: num(oldBudget.monthlyBudgetBs, DEFAULT_BUDGET.monthlyBudgetBs),
      billingCycleStartDay: Math.min(28, Math.max(1, Math.round(num(oldBudget.billingCycleStartDay, 1)))),
      warningThresholdPct: num(oldBudget.warningThresholdPct, DEFAULT_BUDGET.warningThresholdPct),
      maxPowerThresholdW: num(oldBudget.maxPowerThresholdW, DEFAULT_BUDGET.maxPowerThresholdW),
    },
    connection: {
      mode,
      host: typeof oldConnection.ipAddress === 'string' && oldConnection.ipAddress ? oldConnection.ipAddress : DEFAULT_CONNECTION.host,
      pollingIntervalMs: num(oldConnection.pollingIntervalMs, DEFAULT_CONNECTION.pollingIntervalMs),
    },
    ledger: mode === 'simulation' ? createDemoLedger(now) : { meterKWh: 0, sensorKWh: null, cycleStartKWh: 0, daily: {} },
    hasDemoData: mode === 'simulation',
    captures: Array.isArray(old.meterCaptures)
      ? old.meterCaptures.map(migrateLegacyCapture).filter((c): c is MeterCaptureRecord => c !== null).slice(0, MAX_CAPTURES)
      : [],
  };
}
