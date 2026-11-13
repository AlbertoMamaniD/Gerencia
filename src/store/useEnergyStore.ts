/**
 * Store global (Zustand).
 * - Persistente (AsyncStorage con escritura agrupada): presupuesto, fuente de datos,
 *   libro del medidor, capturas y tema.
 * - Volátil (RAM): última lectura, curva de potencia, estado de conexión y alertas.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { alertsEqual, evaluateAlertConditions, reconcileAlerts } from '@/domain/alerts';
import { ApplianceItem, DEFAULT_TARIJA_APPLIANCES } from '@/domain/appliances';
import { calculateFinancialProjection, getBillingCycle } from '@/domain/billing';
import {
  applySensorReading,
  calibrateLedger,
  createLedger,
  detachSensor,
  getCycleEnergyKWh,
  resetLedgerCycle,
  toLocalDateKey,
} from '@/domain/meter';
import {
  ActiveAlert,
  AlertType,
  BudgetConfig,
  ConnectionConfig,
  ConnectionStatus,
  LivePowerPoint,
  MeterCaptureRecord,
  PZEMReading,
} from '@/domain/types';
import type { ThemePreference } from '@/theme/ThemeProvider';
import {
  createInitialPersistedState,
  MAX_CAPTURES,
  migratePersistedState,
  PersistedState,
  STORE_VERSION,
} from './migrations';
import { flushStorage, throttledStorage } from './throttledStorage';

export const POWER_HISTORY_SIZE = 30;
/** Sin lecturas nuevas por más de este tiempo, la potencia mostrada deja de considerarse vigente. */
export const STALE_READING_MS = 10_000;
export const STORAGE_KEY = 'ahorratech-storage-v2';

interface RuntimeState {
  liveReading: PZEMReading | null;
  powerHistory: LivePowerPoint[];
  status: ConnectionStatus;
  alerts: ActiveAlert[];
  /** Fecha local (YYYY-MM-DD) de la última evaluación; cambia a medianoche. */
  today: string;
  hasHydrated: boolean;
}

interface Actions {
  ingestReading: (reading: PZEMReading) => void;
  reportConnectionError: (message: string, now?: number) => void;
  updateBudget: (changes: Partial<BudgetConfig>) => void;
  updateConnection: (changes: Partial<ConnectionConfig>) => void;
  setThemePreference: (preference: ThemePreference) => void;
  calibrateMeter: (meterReadingKWh: number) => void;
  addCapture: (capture: MeterCaptureRecord) => void;
  dismissAlert: (id: string) => void;
  resetCycle: () => void;
  refreshAlerts: (now?: number) => void;
  markAlertNotified: (type: AlertType, at: number) => void;
  updateAppliance: (id: string, changes: Partial<ApplianceItem>) => void;
  addAppliance: (appliance: ApplianceItem) => void;
  removeAppliance: (id: string) => void;
  resetAppliances: () => void;
}

export type EnergyState = PersistedState & RuntimeState & Actions;

export const initialRuntimeState: RuntimeState = {
  liveReading: null,
  powerHistory: [],
  status: { isConnected: false, lastSyncTime: null, errorMessage: null },
  alerts: [],
  today: toLocalDateKey(new Date()),
  hasHydrated: false,
};

type Evaluation = Pick<EnergyState, 'ledger' | 'cycleKey' | 'alerts' | 'dismissedAlertTypes' | 'today'>;

/**
 * Evalúa el estado en el instante `now`:
 * 1. Si empezó un nuevo ciclo de facturación, reinicia el consumo del ciclo automáticamente.
 * 2. Recalcula las alertas de sobrecarga y presupuesto.
 */
function evaluate(state: EnergyState, now: number): Evaluation {
  const date = new Date(now);
  const cycleKey = toLocalDateKey(getBillingCycle(date, state.budget.billingCycleStartDay).start);

  let ledger = state.ledger;
  let dismissed = state.dismissedAlertTypes;
  let currentKey = state.cycleKey;
  if (currentKey === null) {
    currentKey = cycleKey;
  } else if (cycleKey > currentKey) {
    ledger = resetLedgerCycle(ledger);
    dismissed = [];
    currentKey = cycleKey;
  }

  const projection = calculateFinancialProjection({
    cycleEnergyKWh: getCycleEnergyKWh(ledger),
    ratePerKWh: state.budget.ratePerKWh,
    monthlyBudgetBs: state.budget.monthlyBudgetBs,
    cycleStartDay: state.budget.billingCycleStartDay,
    warningThresholdPct: state.budget.warningThresholdPct,
    referenceDate: date,
  });
  const conditions = evaluateAlertConditions({
    powerW: state.liveReading?.power ?? 0,
    maxPowerW: state.budget.maxPowerThresholdW,
    consumedPct: projection.budgetConsumedPct,
    warningThresholdPct: state.budget.warningThresholdPct,
    monthlyBudgetBs: state.budget.monthlyBudgetBs,
  });
  const result = reconcileAlerts(state.alerts, conditions, dismissed, now);
  const sameDismissed =
    result.dismissed.length === state.dismissedAlertTypes.length &&
    result.dismissed.every((t) => state.dismissedAlertTypes.includes(t));

  return {
    ledger,
    cycleKey: currentKey,
    alerts: alertsEqual(result.alerts, state.alerts) ? state.alerts : result.alerts,
    dismissedAlertTypes: sameDismissed ? state.dismissedAlertTypes : result.dismissed,
    today: toLocalDateKey(date),
  };
}

export const useEnergyStore = create<EnergyState>()(
  persist(
    (set, get) => {
      /** Cambios hechos por el usuario: se guardan a disco de inmediato (sin esperar el agrupado). */
      const commit = (partial: Partial<EnergyState>) => {
        set(partial);
        void flushStorage();
      };
      const setAndRefresh = (partial: Partial<EnergyState>) => {
        commit(partial);
        get().refreshAlerts();
      };

      return {
        ...createInitialPersistedState(),
        ...initialRuntimeState,

        ingestReading: (reading) => {
          const state = get();
          const next: EnergyState = {
            ...state,
            ledger: applySensorReading(state.ledger, reading.energy, new Date(reading.timestamp)),
            liveReading: reading,
            powerHistory: [...state.powerHistory, { timestamp: reading.timestamp, power: reading.power }].slice(
              -POWER_HISTORY_SIZE
            ),
            status: { isConnected: true, lastSyncTime: reading.timestamp, errorMessage: null },
          };
          set({
            liveReading: next.liveReading,
            powerHistory: next.powerHistory,
            status: next.status,
            ...evaluate(next, reading.timestamp),
          });
        },

        reportConnectionError: (message, now = Date.now()) => {
          const state = get();
          const status = { ...state.status, isConnected: false, errorMessage: message };
          const stale = state.status.lastSyncTime === null || now - state.status.lastSyncTime > STALE_READING_MS;
          if (!stale) {
            set({ status });
            return;
          }
          // La última potencia ya no es real: se deja de mostrar y se retira la alerta de sobrecarga.
          const next: EnergyState = { ...state, status, liveReading: null };
          set({ status, liveReading: null, ...evaluate(next, now) });
        },

        updateBudget: (changes) => {
          const state = get();
          const budget = { ...state.budget, ...changes };
          // Cambiar el día de inicio no debe borrar el consumo ya medido: solo se re-ancla el ciclo.
          const cycleKey =
            budget.billingCycleStartDay !== state.budget.billingCycleStartDay
              ? toLocalDateKey(getBillingCycle(new Date(), budget.billingCycleStartDay).start)
              : state.cycleKey;
          setAndRefresh({ budget, cycleKey });
        },

        updateConnection: (changes) => {
          const state = get();
          const connection = { ...state.connection, ...changes };
          const sourceChanged = connection.mode !== state.connection.mode || connection.host !== state.connection.host;
          if (!sourceChanged) {
            commit({ connection });
            return;
          }
          // Al pasar a un ESP32 real se descartan los datos de demostración.
          const leavingDemo = state.hasDemoData && connection.mode === 'hardware';
          setAndRefresh({
            connection,
            ledger: leavingDemo ? createLedger(0) : detachSensor(state.ledger),
            hasDemoData: leavingDemo ? false : state.hasDemoData,
            liveReading: null,
            powerHistory: [],
            status: { isConnected: false, lastSyncTime: null, errorMessage: null },
          });
        },

        setThemePreference: (themePreference) => commit({ themePreference }),

        calibrateMeter: (meterReadingKWh) => {
          setAndRefresh({ ledger: calibrateLedger(get().ledger, meterReadingKWh) });
        },

        addCapture: (capture) => {
          commit({ captures: [capture, ...get().captures].slice(0, MAX_CAPTURES) });
        },

        dismissAlert: (id) => {
          const state = get();
          const alert = state.alerts.find((a) => a.id === id);
          if (!alert) return;
          commit({
            alerts: state.alerts.filter((a) => a.id !== id),
            dismissedAlertTypes: Array.from(new Set([...state.dismissedAlertTypes, alert.type])),
          });
        },

        resetCycle: () => {
          setAndRefresh({ ledger: resetLedgerCycle(get().ledger), dismissedAlertTypes: [] });
        },

        refreshAlerts: (now = Date.now()) => {
          set(evaluate(get(), now));
        },

        markAlertNotified: (type, at) => {
          const state = get();
          commit({ alertNotifications: { ...state.alertNotifications, [type]: { at, cycleKey: state.cycleKey } } });
        },

        updateAppliance: (id, changes) => {
          const appliances = get().appliances.map((a) => (a.id === id ? { ...a, ...changes } : a));
          commit({ appliances });
        },

        addAppliance: (appliance) => {
          commit({ appliances: [...get().appliances, appliance] });
        },

        removeAppliance: (id) => {
          commit({ appliances: get().appliances.filter((a) => a.id !== id) });
        },

        resetAppliances: () => {
          commit({ appliances: DEFAULT_TARIJA_APPLIANCES });
        },
      };
    },
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => throttledStorage),
      partialize: (state): PersistedState => ({
        budget: state.budget,
        connection: state.connection,
        ledger: state.ledger,
        captures: state.captures,
        themePreference: state.themePreference,
        hasDemoData: state.hasDemoData,
        cycleKey: state.cycleKey,
        dismissedAlertTypes: state.dismissedAlertTypes,
        alertNotifications: state.alertNotifications,
        appliances: state.appliances,
      }),
      migrate: (persisted, version) => migratePersistedState(persisted, version) as unknown as EnergyState,
      onRehydrateStorage: () => () => {
        useEnergyStore.setState({ hasHydrated: true });
        useEnergyStore.getState().refreshAlerts();
      },
    }
  )
);
