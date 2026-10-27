/**
 * AhorraTech - Type Contracts
 * Telemetría PZEM-004T, Presupuesto FinTech, Historial y Estados IoT
 */

export interface PZEMReading {
  voltage: number;       // Tensión en Voltios (V) ~220V
  current: number;       // Corriente en Amperios (A)
  power: number;         // Potencia Activa en Watts (W)
  energy: number;        // Energía acumulada en kWh
  frequency: number;     // Frecuencia de red en Hertz (Hz) ~50Hz
  powerFactor: number;   // Factor de Potencia (0.00 - 1.00)
  timestamp: number;     // Epoch timestamp en ms
}

export interface BudgetConfig {
  ratePerKWh: number;             // Tarifa en Bolivianos por kWh (ej. 0.85 Bs/kWh)
  monthlyBudgetBs: number;        // Presupuesto mensual límite en Bolivianos (Bs)
  billingCycleStartDay: number;   // Día del mes de inicio del ciclo de facturación (1-31)
  warningThresholdPct: number;    // Porcentaje de advertencia (ej. 80%)
  criticalThresholdPct: number;   // Porcentaje crítico / corte (ej. 100%)
  maxPowerThresholdW: number;     // Umbral de sobrecarga eléctrica en Watts (ej. 3500 W)
}

export type ConnectionMode = 'simulation' | 'hardware';

export interface DeviceConnection {
  mode: ConnectionMode;
  ipAddress: string;
  pollingIntervalMs: number;
  isConnected: boolean;
  isPolling: boolean;
  lastSyncTime: number | null;
  errorMessage: string | null;
  rssi?: number;                  // Nivel de señal WiFi en dBm (opcional de ESP32)
}

export interface LivePowerPoint {
  timestamp: number;
  timeLabel: string;
  power: number;
}

export interface DailyConsumption {
  date: string;          // ISO string YYYY-MM-DD
  dayLabel: string;      // ej. "Lun", "Mar"
  energyKWh: number;     // Consumo del día en kWh
  costBs: number;        // Costo del día en Bolivianos (Bs)
}

export type AlertType = 'overload' | 'budget_warning' | 'budget_exceeded' | 'device_offline';

export interface ActiveAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: 'warning' | 'critical' | 'info';
  timestamp: number;
}

export interface MeterCaptureRecord {
  id: string;
  imageUri: string;
  detectedKWh: number;
  costBs: number;
  timestamp: number;
  meterSerial: string;
  confidence: number;
  status: 'calibrated' | 'pending';
}

export interface FinancialProjection {
  currentCostBs: number;
  currentEnergyKWh: number;
  projectedCostBs: number;
  projectedEnergyKWh: number;
  budgetConsumedPct: number;
  projectedOverBudgetBs: number;
  daysRemainingInCycle: number;
  averageDailyCostBs: number;
  isOverBudget: boolean;
  isWarningBudget: boolean;
}

export interface EnergyStoreState {
  // Telemetría en RAM (alta frecuencia)
  liveReading: PZEMReading;
  powerHistory: LivePowerPoint[];
  activeAlerts: ActiveAlert[];

  // Configuración persistida (AsyncStorage)
  budgetConfig: BudgetConfig;
  connection: DeviceConnection;
  dailyHistory: DailyConsumption[];
  cycleStartTimestamp: number;
  meterCaptures: MeterCaptureRecord[];

  // Acciones
  setLiveReading: (reading: PZEMReading) => void;
  updateBudgetConfig: (config: Partial<BudgetConfig>) => void;
  updateConnection: (conn: Partial<DeviceConnection>) => void;
  addAlert: (alert: ActiveAlert) => void;
  dismissAlert: (id: string) => void;
  resetBillingCycle: () => void;
  seedInitialDataIfEmpty: () => void;
  addMeterCapture: (capture: MeterCaptureRecord) => void;
  calibrateEnergyFromMeter: (newEnergyKWh: number) => void;
}
