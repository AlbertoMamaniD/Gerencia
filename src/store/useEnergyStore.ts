/**
 * Store global (Zustand).
 * - Persistente (AsyncStorage con escritura agrupada): presupuesto, fuente de datos,
 *   libro del medidor, capturas y tema.
 * - Volátil (RAM): última lectura, curva de potencia, estado de conexión y alertas.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { alertsEqual, evaluateAlertConditions, reconcileAlerts } from '@/domain/alerts';
import { calculateFinancialProjection } from '@/domain/billing';
import {
  applySensorReading,
  calibrateLedger,
  createLedger,
  detachSensor,
  getCycleEnergyKWh,
  resetLedgerCycle,
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
export const STORAGE_KEY = 'ahorratech-storage-v2';

interface RuntimeState {
  liveReading: PZEMReading | null;
  powerHistory: LivePowerPoint[];
  status: ConnectionStatus;
  alerts: ActiveAlert[];
  dismissedAlertTypes: AlertType[];
  hasHydrated: boolean;
}

interface Actions {
  ingestReading: (reading: PZEMReading) => void;
  reportConnectionError: (message: string) => void;
  updateBudget: (changes: Partial<BudgetConfig>) => void;
  updateConnection: (changes: Partial<ConnectionConfig>) => void;
  setThemePreference: (preference: ThemePreference) => void;
  calibrateMeter: (meterReadingKWh: number) => void;
  addCapture: (capture: MeterCaptureRecord) => void;
  dismissAlert: (id: string) => void;
  resetCycle: () => void;
  refreshAlerts: (now?: number) => void;
}

export type EnergyState = PersistedState & RuntimeState & Actions;

export const initialRuntimeState: RuntimeState = {
  liveReading: null,
  powerHistory: [],
  status: { isConnected: false, lastSyncTime: null, errorMessage: null },
  alerts: [],
  dismissedAlertTypes: [],
  hasHydrated: false,
};

/** Recalcula las alertas a partir del estado (presupuesto + potencia). */
function computeAlerts(state: EnergyState, now: number): Pick<RuntimeState, 'alerts' | 'dismissedAlertTypes'> {
  const projection = calculateFinancialProjection({
    cycleEnergyKWh: getCycleEnergyKWh(state.ledger),
    ratePerKWh: state.budget.ratePerKWh,
    monthlyBudgetBs: state.budget.monthlyBudgetBs,
    cycleStartDay: state.budget.billingCycleStartDay,
    warningThresholdPct: state.budget.warningThresholdPct,
    referenceDate: new Date(now),
  });
  const conditions = evaluateAlertConditions({
    powerW: state.liveReading?.power ?? 0,
    maxPowerW: state.budget.maxPowerThresholdW,
    consumedPct: projection.budgetConsumedPct,
    warningThresholdPct: state.budget.warningThresholdPct,
    currentCostBs: projection.currentCostBs,
    monthlyBudgetBs: state.budget.monthlyBudgetBs,
  });
  const result = reconcileAlerts(state.alerts, conditions, state.dismissedAlertTypes, now);
  return {
    alerts: alertsEqual(result.alerts, state.alerts) ? state.alerts : result.alerts,
    dismissedAlertTypes: result.dismissed,
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
            ledger: next.ledger,
            liveReading: next.liveReading,
            powerHistory: next.powerHistory,
            status: next.status,
            ...computeAlerts(next, reading.timestamp),
          });
        },

        reportConnectionError: (message) => {
          set((state) => ({ status: { ...state.status, isConnected: false, errorMessage: message } }));
        },

        updateBudget: (changes) => {
          setAndRefresh({ budget: { ...get().budget, ...changes } });
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
          set((state) => {
            const alert = state.alerts.find((a) => a.id === id);
            if (!alert) return state;
            return {
              alerts: state.alerts.filter((a) => a.id !== id),
              dismissedAlertTypes: Array.from(new Set([...state.dismissedAlertTypes, alert.type])),
            };
          });
        },

        resetCycle: () => {
          setAndRefresh({ ledger: resetLedgerCycle(get().ledger), dismissedAlertTypes: [] });
        },

        refreshAlerts: (now = Date.now()) => {
          set(computeAlerts(get(), now));
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
      }),
      migrate: (persisted, version) => migratePersistedState(persisted, version) as unknown as EnergyState,
      onRehydrateStorage: () => () => {
        useEnergyStore.setState({ hasHydrated: true });
        useEnergyStore.getState().refreshAlerts();
      },
    }
  )
);
