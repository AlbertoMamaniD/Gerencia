/**
 * Detecta el cambio de día (medianoche o al volver a la app después de horas)
 * aunque no lleguen lecturas nuevas: actualiza "Hoy", el día del ciclo y,
 * si corresponde, inicia el nuevo ciclo de facturación.
 */

import { useEffect } from 'react';
import { AppState } from 'react-native';
import { toLocalDateKey } from '@/domain/meter';
import { useEnergyStore } from '@/store/useEnergyStore';

export const DAY_CHECK_INTERVAL_MS = 60_000;

export function useDayRollover(): void {
  const hasHydrated = useEnergyStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    const check = () => {
      const store = useEnergyStore.getState();
      if (toLocalDateKey(new Date()) !== store.today) store.refreshAlerts();
    };

    const timer = setInterval(check, DAY_CHECK_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') check();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [hasHydrated]);
}
