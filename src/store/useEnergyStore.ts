/**
 * AhorraTech - Store Global (Zustand v4)
 * Arquitectura Híbrida:
 * - Telemetría en vivo (alta frecuencia: 2s) en RAM para 60 FPS sin I/O overhead.
 * - Configuración financiera (Bs), historial y hardware persistidos en AsyncStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EnergyStoreState,
  PZEMReading,
  BudgetConfig,
  DeviceConnection,
  LivePowerPoint,
  DailyConsumption,
  ActiveAlert,
} from '../types/energy.types';
import { formatShortTime } from '../utils/formatters';

const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  ratePerKWh: 0.85,           // Tarifa promedio residencial en Bolivia (Bs/kWh)
  monthlyBudgetBs: 180.00,    // Presupuesto mensual objetivo (Bs)
  billingCycleStartDay: 1,    // Inicio de ciclo: 1er día del mes
  warningThresholdPct: 80,    // Alerta preventiva al 80%
  criticalThresholdPct: 100,  // Alerta crítica al 100%
  maxPowerThresholdW: 3500,   // Corte preventivo a 3.5 kW (típico disyuntor 16A a 220V)
};

const DEFAULT_CONNECTION: DeviceConnection = {
  mode: 'simulation',
  ipAddress: '192.168.4.1',   // IP AP por defecto del ESP32
  pollingIntervalMs: 2000,    // 2 segundos
  isConnected: true,
  isPolling: false,
  lastSyncTime: null,
  errorMessage: null,
  rssi: -62,
  geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hchigziyarizebvcqwub.supabase.co',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6ZqtKkD9sVigU0jOLit1hg_7WMMhQxi',
};

const INITIAL_READING: PZEMReading = {
  voltage: 221.4,
  current: 3.25,
  power: 712.0,
  energy: 84.60,
  frequency: 50.1,
  powerFactor: 0.98,
  timestamp: Date.now(),
};

/**
 * Genera 7 días de historial realista de consumo residencial en Bolivia.
 */
function generateSeedDailyHistory(): DailyConsumption[] {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const now = new Date();
  const history: DailyConsumption[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayLabel = days[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];

    // Consumo típico diario entre 3.2 kWh y 5.8 kWh
    const baseKWh = 3.8 + Math.sin(i * 1.2) * 1.4;
    const energyKWh = Number(baseKWh.toFixed(2));
    const costBs = Number((energyKWh * DEFAULT_BUDGET_CONFIG.ratePerKWh).toFixed(2));

    history.push({
      date: dateStr,
      dayLabel,
      energyKWh,
      costBs,
    });
  }

  return history;
}

export const useEnergyStore = create<EnergyStoreState>()(
  persist(
    (set, get) => ({
      // Telemetría en RAM (Volátil, 60 FPS)
      liveReading: INITIAL_READING,
      powerHistory: [
        { timestamp: Date.now() - 38000, timeLabel: formatShortTime(Date.now() - 38000), power: 650 },
        { timestamp: Date.now() - 36000, timeLabel: formatShortTime(Date.now() - 36000), power: 680 },
        { timestamp: Date.now() - 34000, timeLabel: formatShortTime(Date.now() - 34000), power: 710 },
        { timestamp: Date.now() - 32000, timeLabel: formatShortTime(Date.now() - 32000), power: 690 },
        { timestamp: Date.now() - 30000, timeLabel: formatShortTime(Date.now() - 30000), power: 720 },
        { timestamp: Date.now() - 28000, timeLabel: formatShortTime(Date.now() - 28000), power: 705 },
        { timestamp: Date.now() - 26000, timeLabel: formatShortTime(Date.now() - 26000), power: 740 },
        { timestamp: Date.now() - 24000, timeLabel: formatShortTime(Date.now() - 24000), power: 850 },
        { timestamp: Date.now() - 22000, timeLabel: formatShortTime(Date.now() - 22000), power: 920 },
        { timestamp: Date.now() - 20000, timeLabel: formatShortTime(Date.now() - 20000), power: 880 },
        { timestamp: Date.now() - 18000, timeLabel: formatShortTime(Date.now() - 18000), power: 790 },
        { timestamp: Date.now() - 16000, timeLabel: formatShortTime(Date.now() - 16000), power: 710 },
        { timestamp: Date.now() - 14000, timeLabel: formatShortTime(Date.now() - 14000), power: 700 },
        { timestamp: Date.now() - 12000, timeLabel: formatShortTime(Date.now() - 12000), power: 715 },
        { timestamp: Date.now() - 10000, timeLabel: formatShortTime(Date.now() - 10000), power: 730 },
        { timestamp: Date.now() - 8000, timeLabel: formatShortTime(Date.now() - 8000), power: 705 },
        { timestamp: Date.now() - 6000, timeLabel: formatShortTime(Date.now() - 6000), power: 695 },
        { timestamp: Date.now() - 4000, timeLabel: formatShortTime(Date.now() - 4000), power: 710 },
        { timestamp: Date.now() - 2000, timeLabel: formatShortTime(Date.now() - 2000), power: 712 },
        { timestamp: Date.now(), timeLabel: formatShortTime(Date.now()), power: 712 },
      ],
      activeAlerts: [],

      // Estado Persistente
      budgetConfig: DEFAULT_BUDGET_CONFIG,
      connection: DEFAULT_CONNECTION,
      dailyHistory: generateSeedDailyHistory(),
      cycleStartTimestamp: Date.now() - 14 * 24 * 60 * 60 * 1000, // Hace 14 días

      // Actualizar lectura en vivo
      setLiveReading: (reading: PZEMReading) => {
        const state = get();
        const newPoint: LivePowerPoint = {
          timestamp: reading.timestamp,
          timeLabel: formatShortTime(reading.timestamp),
          power: reading.power,
        };

        // Mantener exactamente las últimas 20 lecturas
        const updatedHistory = [...state.powerHistory.slice(-19), newPoint];

        // Verificar sobrecarga eléctrica de potencia instantánea
        const isOverloaded = reading.power > state.budgetConfig.maxPowerThresholdW;
        let updatedAlerts = state.activeAlerts;

        if (isOverloaded) {
          const alertExists = updatedAlerts.some((a) => a.type === 'overload');
          if (!alertExists) {
            updatedAlerts = [
              ...updatedAlerts,
              {
                id: `overload-${Date.now()}`,
                type: 'overload',
                title: '¡Sobrecarga Eléctrica Detectada!',
                message: `Potencia actual de ${Math.round(reading.power)} W superó el umbral seguro de ${state.budgetConfig.maxPowerThresholdW} W.`,
                severity: 'critical',
                timestamp: Date.now(),
              },
            ];
          }
        } else {
          // Descartar alerta de sobrecarga automáticamente si se normaliza
          updatedAlerts = updatedAlerts.filter((a) => a.type !== 'overload');
        }

        set({
          liveReading: reading,
          powerHistory: updatedHistory,
          activeAlerts: updatedAlerts,
        });
      },

      updateBudgetConfig: (newConfig: Partial<BudgetConfig>) => {
        set((state) => ({
          budgetConfig: {
            ...state.budgetConfig,
            ...newConfig,
          },
        }));
      },

      updateConnection: (newConn: Partial<DeviceConnection>) => {
        set((state) => ({
          connection: {
            ...state.connection,
            ...newConn,
          },
        }));
      },

      addAlert: (alert: ActiveAlert) => {
        set((state) => {
          if (state.activeAlerts.some((a) => a.id === alert.id || a.type === alert.type)) {
            return state;
          }
          return { activeAlerts: [alert, ...state.activeAlerts] };
        });
      },

      dismissAlert: (id: string) => {
        set((state) => ({
          activeAlerts: state.activeAlerts.filter((a) => a.id !== id),
        }));
      },

      meterCaptures: [],

      resetBillingCycle: () => {
        set({
          cycleStartTimestamp: Date.now(),
          dailyHistory: generateSeedDailyHistory(),
        });
      },

      seedInitialDataIfEmpty: () => {
        const state = get();
        if (!state.dailyHistory || state.dailyHistory.length === 0) {
          set({ dailyHistory: generateSeedDailyHistory() });
        }
      },

      addMeterCapture: (capture) => {
        set((state) => ({
          meterCaptures: [capture, ...state.meterCaptures],
        }));
      },

      calibrateEnergyFromMeter: (newEnergyKWh: number) => {
        const state = get();
        set({
          liveReading: {
            ...state.liveReading,
            energy: Number(newEnergyKWh.toFixed(2)),
          },
        });
      },
    }),
    {
      name: 'ahorratech-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        budgetConfig: state.budgetConfig,
        connection: {
          mode: state.connection.mode,
          ipAddress: state.connection.ipAddress,
          pollingIntervalMs: state.connection.pollingIntervalMs,
          isConnected: state.connection.isConnected,
          isPolling: false,
          lastSyncTime: state.connection.lastSyncTime,
          errorMessage: null,
        },
        dailyHistory: state.dailyHistory,
        cycleStartTimestamp: state.cycleStartTimestamp,
        meterCaptures: state.meterCaptures,
      }),
    }
  )
);
