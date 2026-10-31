/**
 * Ciclo de lectura de telemetría (ESP32 o simulador).
 * - Se pausa en segundo plano (ahorro de batería) y guarda el estado pendiente en disco.
 * - Evita solicitudes superpuestas y descarta respuestas de una fuente anterior.
 */

import { useEffect } from 'react';
import { AppState } from 'react-native';
import { fetchEsp32Reading } from '@/services/telemetry/esp32Client';
import { simulateReading } from '@/services/telemetry/simulator';
import { useEnergyStore } from '@/store/useEnergyStore';
import { flushStorage } from '@/store/throttledStorage';

export function useTelemetryPolling(): void {
  const hasHydrated = useEnergyStore((s) => s.hasHydrated);
  const mode = useEnergyStore((s) => s.connection.mode);
  const host = useEnergyStore((s) => s.connection.host);
  const intervalMs = useEnergyStore((s) => s.connection.pollingIntervalMs);

  useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;
    let inFlight = false;
    let tick = 0;
    let timer: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      if (inFlight || cancelled) return;
      const store = useEnergyStore.getState();

      if (mode === 'simulation') {
        tick += 1;
        const previous = store.liveReading?.energy ?? 0;
        store.ingestReading(simulateReading(tick, previous, intervalMs, Date.now()));
        return;
      }

      inFlight = true;
      try {
        const reading = await fetchEsp32Reading(host);
        if (!cancelled) useEnergyStore.getState().ingestReading(reading);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'No se pudo leer el ESP32.';
          useEnergyStore.getState().reportConnectionError(message);
        }
      } finally {
        inFlight = false;
      }
    };

    const start = () => {
      if (timer) return;
      void poll();
      timer = setInterval(() => void poll(), intervalMs);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    if (AppState.currentState !== 'background') start();

    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        start();
      } else {
        stop();
        void flushStorage();
      }
    });

    return () => {
      cancelled = true;
      stop();
      subscription.remove();
    };
  }, [hasHydrated, mode, host, intervalMs]);
}
