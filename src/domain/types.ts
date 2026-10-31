/**
 * Contratos del dominio: telemetría PZEM-004T, presupuesto, medidor y alertas.
 */

export interface PZEMReading {
  voltage: number; // V
  current: number; // A
  power: number; // W
  /** Energía acumulada que reporta la fuente (sensor o simulador), en kWh. */
  energy: number;
  frequency: number; // Hz
  powerFactor: number; // 0..1
  timestamp: number; // epoch ms
}

export interface BudgetConfig {
  ratePerKWh: number; // Bs/kWh
  monthlyBudgetBs: number;
  billingCycleStartDay: number; // 1..28
  warningThresholdPct: number; // 50..99
  maxPowerThresholdW: number;
}

export type ConnectionMode = 'simulation' | 'hardware';

/** Configuración persistida de la fuente de datos. */
export interface ConnectionConfig {
  mode: ConnectionMode;
  host: string;
  pollingIntervalMs: number;
}

/** Estado volátil de la conexión (no se persiste). */
export interface ConnectionStatus {
  isConnected: boolean;
  lastSyncTime: number | null;
  errorMessage: string | null;
}

export interface LivePowerPoint {
  timestamp: number;
  power: number;
}

/** Consumo diario en kWh indexado por fecha local YYYY-MM-DD. */
export type DailyEnergyMap = Record<string, number>;

export interface DailyConsumption {
  date: string;
  dayLabel: string;
  energyKWh: number;
  costBs: number;
  isToday: boolean;
}

export type AlertType = 'overload' | 'budget_warning' | 'budget_exceeded';
export type AlertSeverity = 'warning' | 'critical';

export interface ActiveAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: number;
}

export type CaptureSource = 'ocr' | 'manual';

export interface MeterCaptureRecord {
  id: string;
  imageUri: string | null;
  detectedKWh: number;
  costBs: number;
  timestamp: number;
  meterSerial: string | null;
  confidence: number | null;
  source: CaptureSource;
  cloudSynced: boolean;
}

export interface BillingCycle {
  start: Date;
  /** Inicio del siguiente ciclo (exclusivo). */
  end: Date;
  lengthDays: number;
  /** Día actual dentro del ciclo, empezando en 1. */
  dayOfCycle: number;
  daysRemaining: number;
}

export type BudgetStatus = 'ok' | 'warning' | 'exceeded';

export interface FinancialProjection {
  cycleEnergyKWh: number;
  currentCostBs: number;
  projectedCostBs: number;
  projectedEnergyKWh: number;
  budgetConsumedPct: number;
  remainingBudgetBs: number;
  overBudgetBs: number;
  projectedOverBudgetBs: number;
  averageDailyCostBs: number;
  status: BudgetStatus;
  cycle: BillingCycle;
}
