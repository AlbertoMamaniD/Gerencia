/**
 * Datos derivados para la interfaz: proyección financiera y serie semanal.
 * Dependen de `today` para recalcularse al cambiar de día aunque no lleguen lecturas.
 */

import { useMemo } from 'react';
import { calculateFinancialProjection } from '@/domain/billing';
import { buildWeeklySeries, getCycleEnergyKWh } from '@/domain/meter';
import { DailyConsumption, FinancialProjection } from '@/domain/types';
import { useEnergyStore } from '@/store/useEnergyStore';

export function useProjection(): FinancialProjection {
  const meterKWh = useEnergyStore((s) => s.ledger.meterKWh);
  const cycleStartKWh = useEnergyStore((s) => s.ledger.cycleStartKWh);
  const budget = useEnergyStore((s) => s.budget);
  const today = useEnergyStore((s) => s.today);

  return useMemo(
    () =>
      calculateFinancialProjection({
        cycleEnergyKWh: getCycleEnergyKWh({ meterKWh, cycleStartKWh, sensorKWh: null, daily: {} }),
        ratePerKWh: budget.ratePerKWh,
        monthlyBudgetBs: budget.monthlyBudgetBs,
        cycleStartDay: budget.billingCycleStartDay,
        warningThresholdPct: budget.warningThresholdPct,
        referenceDate: new Date(),
      }),
    // `today` fuerza el recálculo a medianoche.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meterKWh, cycleStartKWh, budget, today]
  );
}

export function useWeeklySeries(): DailyConsumption[] {
  const daily = useEnergyStore((s) => s.ledger.daily);
  const rate = useEnergyStore((s) => s.budget.ratePerKWh);
  const today = useEnergyStore((s) => s.today);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => buildWeeklySeries(daily, rate, new Date()), [daily, rate, today]);
}
