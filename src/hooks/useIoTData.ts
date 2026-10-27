/**
 * AhorraTech - IoT Telemetry Hook
 * Maneja el ciclo de vida del polling HTTP hacia el ESP32 o la simulación física matemática.
 * Pausa inmediata al pasar a segundo plano mediante AppState para garantizar eficiencia de batería.
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useEnergyStore } from '../store/useEnergyStore';
import { PZEMReading } from '../types/energy.types';

// Estado simulado continuo
let simulatedEnergyKWh = 84.60;
let simulationTicks = 0;

export function useIoTData() {
  const mode = useEnergyStore((s) => s.connection.mode);
  const ipAddress = useEnergyStore((s) => s.connection.ipAddress);
  const pollingIntervalMs = useEnergyStore((s) => s.connection.pollingIntervalMs);
  const setLiveReading = useEnergyStore((s) => s.setLiveReading);
  const updateConnection = useEnergyStore((s) => s.updateConnection);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAppActiveRef = useRef<boolean>(true);

  // Generador de simulación física de cargas residenciales
  const stepSimulation = () => {
    simulationTicks++;
    const now = Date.now();

    // Fluctuación realista de la red boliviana (~220V @ 50Hz)
    const baseVoltage = 220.0;
    const voltageNoise = Math.sin(simulationTicks * 0.3) * 2.5 + (Math.random() - 0.5) * 1.0;
    const voltage = Number((baseVoltage + voltageNoise).toFixed(1));

    const frequencyNoise = (Math.random() - 0.5) * 0.15;
    const frequency = Number((50.0 + frequencyNoise).toFixed(1));

    // Perfil de consumo dinámico
    // Carga base: refrigerador (140W) + iluminación LED (60W) + equipos standby (80W) = 280W
    let activeWatts = 280 + Math.sin(simulationTicks * 0.15) * 60 + Math.random() * 30;

    // Simular picos periódicos (ej. microondas o hervidor de agua cada ~40 segundos)
    const cycle = simulationTicks % 30;
    if (cycle >= 10 && cycle <= 16) {
      activeWatts += 1150; // Microondas activo
    } else if (cycle >= 24 && cycle <= 27) {
      activeWatts += 850; // Plancha o licuadora activa
    }

    const power = Number(activeWatts.toFixed(1));
    const powerFactor = Number((0.96 + (Math.random() - 0.5) * 0.03).toFixed(2));

    // I = P / (V * PF)
    const current = Number((power / (voltage * powerFactor)).toFixed(2));

    // Integración de energía: dE = (P * dt) / (3600 * 1000)
    const deltaHours = (pollingIntervalMs || 2000) / 3600000;
    simulatedEnergyKWh += (power * deltaHours) / 1000;
    const energy = Number(simulatedEnergyKWh.toFixed(3));

    const reading: PZEMReading = {
      voltage,
      current,
      power,
      energy,
      frequency,
      powerFactor,
      timestamp: now,
    };

    setLiveReading(reading);
    updateConnection({
      isConnected: true,
      lastSyncTime: now,
      errorMessage: null,
      rssi: -58 - Math.floor(Math.random() * 8),
    });
  };

  // Petición HTTP REST hacia el firmware del ESP32
  const fetchESP32Data = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const cleanIp = ipAddress.trim().replace(/^http:\/\//, '').replace(/\/$/, '');
      const url = `http://${cleanIp}/api/telemetry`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const now = Date.now();

      // Mapear payload JSON PZEM-004T del ESP32
      const reading: PZEMReading = {
        voltage: Number(data.voltage ?? 220),
        current: Number(data.current ?? 0),
        power: Number(data.power ?? 0),
        energy: Number(data.energy ?? 0),
        frequency: Number(data.frequency ?? 50),
        powerFactor: Number(data.powerFactor ?? data.pf ?? 1),
        timestamp: now,
      };

      setLiveReading(reading);
      updateConnection({
        isConnected: true,
        lastSyncTime: now,
        errorMessage: null,
        rssi: data.rssi ? Number(data.rssi) : undefined,
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const msg = isAbort
        ? 'Tiempo de espera agotado al conectar con ESP32 (3s)'
        : 'Error de comunicación HTTP con ESP32';

      updateConnection({
        isConnected: false,
        errorMessage: msg,
      });
    }
  };

  const executePoll = () => {
    if (!isAppActiveRef.current) return;

    if (mode === 'simulation') {
      stepSimulation();
    } else {
      fetchESP32Data();
    }
  };

  // Manejo de AppState para 60 FPS y 0 drenaje de batería en background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const isActive = nextAppState === 'active';
      isAppActiveRef.current = isActive;

      if (!isActive) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        updateConnection({ isPolling: false });
      } else {
        updateConnection({ isPolling: true });
        executePoll();
        if (!timerRef.current) {
          timerRef.current = setInterval(executePoll, pollingIntervalMs);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Iniciar polling inicial
    updateConnection({ isPolling: true });
    executePoll();
    timerRef.current = setInterval(executePoll, pollingIntervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      subscription.remove();
      updateConnection({ isPolling: false });
    };
  }, [mode, ipAddress, pollingIntervalMs]);
}
